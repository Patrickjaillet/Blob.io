import * as THREE from 'three';
import { vertexShaderGrid, fragmentShaderGrid } from './fx_shaders.js';

export class CoreEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.updateCameraBase();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000);
        document.body.appendChild(this.renderer.domElement);

        this.initGrid();
        this.initBackground();
        
        window.addEventListener('resize', this.resize.bind(this));
    }

    updateCameraBase() {
        const aspect = window.innerWidth / window.innerHeight;
        const isPortrait = aspect < 1;
        const baseDist = 40;
        const camDist = isPortrait ? baseDist * 1.8 : baseDist;
        this.camera.position.set(0, camDist, camDist);
    }

    initGrid() {
        this.gridPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            new THREE.ShaderMaterial({
                vertexShader: vertexShaderGrid,
                fragmentShader: fragmentShaderGrid,
                uniforms: { 
                    uTime: { value: 0 },
                    uBlobData: { value: new Array(32).fill(0).map(() => new THREE.Vector4()) },
                    uBlobColor: { value: new Array(32).fill(0).map(() => new THREE.Color(0x000000)) },
                    uBlobCount: { value: 0 }
                },
                transparent: true,
                side: THREE.DoubleSide
            })
        );
        this.gridPlane.rotation.x = -Math.PI / 2;
        this.scene.add(this.gridPlane);
    }

    initBackground() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 5000;
        const starPos = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);

        for(let i=0; i<starCount*3; i+=3) {
            starPos[i] = (Math.random() - 0.5) * 2000;
            starPos[i+1] = (Math.random() - 0.5) * 1000;
            starPos[i+2] = (Math.random() - 0.5) * 2000;
            starSizes[i/3] = Math.random() * 2.0;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starMat = new THREE.PointsMaterial({ 
            color: 0xffffff, 
            size: 1.0, 
            transparent: true, 
            opacity: 0.8,
            sizeAttenuation: true 
        });
        this.starField = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starField);

        const nebulaGeo = new THREE.SphereGeometry(800, 32, 32);
        const nebulaMat = new THREE.MeshBasicMaterial({ color: 0x110022, side: THREE.BackSide, transparent: true, opacity: 0.3 });
        this.nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
        this.scene.add(this.nebula);
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updateCameraBase();
    }

    update(dt, playerPos, blobs) {
        this.gridPlane.material.uniforms.uTime.value += dt;
        this.gridPlane.position.x = playerPos.x;
        this.gridPlane.position.z = playerPos.z;
        
        if (blobs) {
            const count = Math.min(blobs.length, 32);
            this.gridPlane.material.uniforms.uBlobCount.value = count;
            for(let i = 0; i < count; i++) {
                const b = blobs[i];
                this.gridPlane.material.uniforms.uBlobData.value[i].set(b.position.x, b.position.y, b.position.z, b.scale.x);
                if (b.material && b.material.uniforms && b.material.uniforms.uColor) {
                    this.gridPlane.material.uniforms.uBlobColor.value[i].copy(b.material.uniforms.uColor.value);
                }
            }
        }

        this.starField.position.x = playerPos.x * 0.95;
        this.starField.position.z = playerPos.z * 0.95;
        this.nebula.position.copy(playerPos);
    }
}
