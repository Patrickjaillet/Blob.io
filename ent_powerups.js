import * as THREE from 'three';
import { vertexShaderBlob, fragmentShaderBlob } from './fx_shaders.js';

export class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];
        this.spawnArea = 200;
    }

    spawn(playerPos) {
        const r = Math.random();
        const type = r < 0.3 ? 'shield' : (r < 0.6 ? 'stealth' : (r < 0.8 ? 'vision' : 'magnet'));
        const color = type === 'shield' ? 0x00ffff : (type === 'stealth' ? 0xaa00ff : (type === 'vision' ? 0x00ff00 : 0xffff00));
        
        const geo = new THREE.OctahedronGeometry(1, 0);
        const mat = new THREE.ShaderMaterial({
            vertexShader: vertexShaderBlob,
            fragmentShader: fragmentShaderBlob,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) },
                uRimColor: { value: new THREE.Color(0xffffff) },
                uNoiseFreq: { value: 1.0 },
                uNoiseAmp: { value: 0.1 },
                uSkinType: { value: 0 },
                uDamage: { value: 0.0 },
                uShield: { value: 0.0 },
                uStealth: { value: 0.0 },
                uMagnet: { value: 0.0 }
            },
            transparent: true
        });

        const p = new THREE.Mesh(geo, mat);
        p.position.set(playerPos.x + (Math.random()-0.5)*this.spawnArea, 1, playerPos.z + (Math.random()-0.5)*this.spawnArea);
        p.userData = { type: type, rotSpeed: Math.random() * 2 + 1 };
        this.scene.add(p);
        this.powerUps.push(p);
    }

    update(dt, player, callbacks) {
        if (Math.random() < 0.002) this.spawn(player.mesh.position);

        for(let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.rotation.y += dt * p.userData.rotSpeed;
            p.material.uniforms.uTime.value += dt;
            
            if(p.position.distanceTo(player.mesh.position) < player.mesh.scale.x + 1) {
                callbacks.onPickup(p.userData.type, p.position);
                this.scene.remove(p);
                this.powerUps.splice(i, 1);
            }
        }
    }

    reset() {
        this.powerUps.forEach(p => this.scene.remove(p));
        this.powerUps.length = 0;
    }
}
