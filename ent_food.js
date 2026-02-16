import * as THREE from 'three';
import { vertexShaderBlob, fragmentShaderBlob } from './fx_shaders.js';
import { ObjectPool } from './sys_pool.js';

export class FoodManager {
    constructor(scene) {
        this.scene = scene;
        this.geometry = new THREE.IcosahedronGeometry(0.3, 8);
        this.types = [
            { type: 'normal', color: 0xff00ff, chance: 0.7 },
            { type: 'speed', color: 0x00ff00, chance: 0.15 },
            { type: 'mass', color: 0xffff00, chance: 0.15 }
        ];
        
        this.pool = new ObjectPool(
            () => {
                const f = new THREE.Mesh(this.geometry, this.createMaterial(0xffffff));
                return f;
            },
            (f) => {
                f.visible = true;
                f.material.uniforms.uTime.value = Math.random() * 100;
            }
        );
    }
    
    get foods() {
        return this.pool.active;
    }

    createMaterial(color) {
        return new THREE.ShaderMaterial({
            vertexShader: vertexShaderBlob,
            fragmentShader: fragmentShaderBlob,
            uniforms: {
                uTime: { value: Math.random() * 100 },
                uColor: { value: new THREE.Color(color) },
                uRimColor: { value: new THREE.Color(0xffffff) },
                uNoiseFreq: { value: 1.0 },
                uNoiseAmp: { value: 0.2 },
                uSkinType: { value: 0 },
                uDamage: { value: 0.0 },
                uShield: { value: 0.0 },
                uStealth: { value: 0.0 },
                uMagnet: { value: 0.0 }
            },
            transparent: true
        });
    }

    spawn(count, area) {
        for(let i=0; i<count; i++) {
            const r = Math.random();
            let typeData = this.types[0];
            if (r > 0.85) typeData = this.types[2];
            else if (r > 0.7) typeData = this.types[1];

            const f = this.pool.get();
            f.material.uniforms.uColor.value.setHex(typeData.color);
            f.position.set((Math.random()-0.5)*area, 0.3, (Math.random()-0.5)*area);
            f.userData = { type: typeData.type };
            this.scene.add(f);
        }
    }

    update(dt, playerPos, area) {
        this.pool.active.forEach(f => {
            f.material.uniforms.uTime.value += dt;
            if(f.position.distanceTo(playerPos) > area) {
                this.respawn(f, area, playerPos);
            }
        });
    }

    respawn(f, area, center) {
        const r = Math.random();
        let typeData = this.types[0];
        if (r > 0.85) typeData = this.types[2];
        else if (r > 0.7) typeData = this.types[1];

        f.userData.type = typeData.type;
        f.material.uniforms.uColor.value.setHex(typeData.color);
        f.position.set(center.x + (Math.random()-0.5)*area, 0.3, center.z + (Math.random()-0.5)*area);
    }

    reset(area) {
        this.pool.active.forEach(f => {
            this.scene.remove(f);
        });
        this.pool.clear();
    }
}
