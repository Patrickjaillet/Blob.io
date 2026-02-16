import * as THREE from 'three';
import { vertexShaderBlob, fragmentShaderBlob } from './fx_shaders.js';

export class Player {
    constructor(scene) {
        this.uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x00ffff) },
            uRimColor: { value: new THREE.Color(0xffffff) },
            uNoiseFreq: { value: 0.8 },
            uNoiseAmp: { value: 0.15 },
            uSkinType: { value: 0 },
            uDamage: { value: 0.0 },
            uShield: { value: 0.0 },
            uStealth: { value: 0.0 },
            uMagnet: { value: 0.0 }
        };

        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShaderBlob,
            fragmentShader: fragmentShaderBlob,
            uniforms: this.uniforms,
            transparent: true
        });

        this.geometry = new THREE.IcosahedronGeometry(1, 64);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.y = 1;
        scene.add(this.mesh);

        this.data = {
            shieldTime: 0,
            stealthTime: 0,
            visionTime: 0,
            hasFlag: false,
            magnetTime: 0
        };
    }

    update(dt) {
        this.uniforms.uTime.value += dt;
        this.uniforms.uDamage.value = THREE.MathUtils.lerp(this.uniforms.uDamage.value, 0.0, dt * 5.0);
        
        if(this.data.shieldTime > 0) {
            this.data.shieldTime -= dt;
            this.uniforms.uShield.value = 1.0;
        } else {
            this.uniforms.uShield.value = 0.0;
        }

        if(this.data.stealthTime > 0) {
            this.data.stealthTime -= dt;
            this.uniforms.uStealth.value = 1.0;
        } else {
            this.uniforms.uStealth.value = 0.0;
        }

        if(this.data.visionTime > 0) this.data.visionTime -= dt;

        if(this.data.magnetTime > 0) {
            this.data.magnetTime -= dt;
            this.uniforms.uMagnet.value = 1.0;
        } else {
            this.uniforms.uMagnet.value = 0.0;
        }
    }

    setSkin(type) {
        this.uniforms.uSkinType.value = type;
        // Update color based on skin for better visibility
        if (type === 0) this.uniforms.uColor.value.setHex(0x00ffff); // Default Cyan
        else if (type === 1) this.uniforms.uColor.value.setHex(0xff00ff); // Cyber Pink
        else if (type === 2) this.uniforms.uColor.value.setHex(0x00ff00); // Matrix Green
        else if (type === 3) this.uniforms.uColor.value.setHex(0xffaa00); // Magma Orange
    }

    setColor(hex) {
        this.uniforms.uColor.value.setHex(hex);
    }

    triggerDamage() {
        this.uniforms.uDamage.value = 1.5; // Stronger flash
    }

    reset(pos) {
        this.mesh.position.copy(pos);
        this.mesh.scale.set(1, 1, 1);
        this.mesh.visible = true;
        this.data.shieldTime = 0;
        this.data.stealthTime = 0;
        this.data.visionTime = 0;
        this.data.hasFlag = false;
        this.data.magnetTime = 0;
    }
}
