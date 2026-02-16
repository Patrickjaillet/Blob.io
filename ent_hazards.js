import * as THREE from 'three';
import { vertexShaderBlob, fragmentShaderBlob } from './fx_shaders.js';

export class HazardManager {
    constructor(scene) {
        this.scene = scene;
        this.meteorites = [];
        this.mines = [];
        this.projectiles = [];
        this.spawnArea = 200;
    }

    spawnMeteorite(playerPos) {
        const geo = new THREE.DodecahedronGeometry(2, 0);
        const mat = new THREE.ShaderMaterial({
            vertexShader: vertexShaderBlob,
            fragmentShader: fragmentShaderBlob,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xff4400) },
                uRimColor: { value: new THREE.Color(0xffffff) },
                uNoiseFreq: { value: 1.0 },
                uNoiseAmp: { value: 0.4 },
                uSkinType: { value: 0 },
                uDamage: { value: 0.0 },
                uShield: { value: 0.0 },
                uStealth: { value: 0.0 },
                uMagnet: { value: 0.0 }
            },
            transparent: true
        });
        const m = new THREE.Mesh(geo, mat);
        const angle = Math.random() * Math.PI * 2;
        const startDist = this.spawnArea * 1.2;
        m.position.set(playerPos.x + Math.cos(angle) * startDist, 1, playerPos.z + Math.sin(angle) * startDist);
        
        const targetX = playerPos.x + (Math.random() - 0.5) * 50;
        const targetZ = playerPos.z + (Math.random() - 0.5) * 50;
        const target = new THREE.Vector3(targetX, 1, targetZ);
        const dir = new THREE.Vector3().subVectors(target, m.position).normalize();
        // Scale speed with player size to keep it challenging but fair
        const speed = (40 + Math.random() * 20) * (1 + playerPos.y * 0.1); 
        
        m.userData = { velocity: dir.multiplyScalar(speed), radius: 2 };
        this.scene.add(m);
        this.meteorites.push(m);
    }

    spawnMine(pos) {
        const geo = new THREE.IcosahedronGeometry(0.8, 0);
        const mat = new THREE.ShaderMaterial({
            vertexShader: vertexShaderBlob,
            fragmentShader: fragmentShaderBlob,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xff0000) },
                uRimColor: { value: new THREE.Color(0xffffff) },
                uNoiseFreq: { value: 2.0 },
                uNoiseAmp: { value: 0.2 },
                uSkinType: { value: 0 },
                uDamage: { value: 0.0 },
                uShield: { value: 0.0 },
                uStealth: { value: 0.0 },
                uMagnet: { value: 0.0 }
            },
            transparent: true
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.copy(pos);
        m.position.y = 0.8;
        m.userData = { armed: false, timer: 0 };
        this.scene.add(m);
        this.mines.push(m);
    }

    spawnProjectile(pos, dir, team) {
        const pGeo = new THREE.SphereGeometry(0.5);
        const pMat = new THREE.MeshBasicMaterial({ color: team === 'blue' ? 0x00ffff : 0xff0000 });
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.copy(pos);
        p.position.y = 4;
        this.scene.add(p);
        this.projectiles.push({ mesh: p, velocity: dir.multiplyScalar(30), life: 3.0, team: team });
    }

    update(dt, player, bots, callbacks) {
        if (Math.random() < 0.001) this.spawnMeteorite(player.mesh.position);

        for(let i = this.meteorites.length - 1; i >= 0; i--) {
            const m = this.meteorites[i];
            m.position.addScaledVector(m.userData.velocity, dt);
            m.rotation.x += dt * 4;
            m.material.uniforms.uTime.value += dt;
            
            if (m.position.distanceTo(player.mesh.position) > this.spawnArea * 1.5) {
                this.scene.remove(m);
                this.meteorites.splice(i, 1);
                continue;
            }

            // Player Collision
            if (m.position.distanceTo(player.mesh.position) < player.mesh.scale.x + 2) {
                if (player.data.shieldTime > 0) {
                    this.scene.remove(m);
                    this.meteorites.splice(i, 1);
                } else {
                    callbacks.onGameOver();
                }
                continue;
            }

            // Bot Collision
            let hitBot = false;
            for (let j = 0; j < bots.length; j++) {
                const bot = bots[j];
                if (m.position.distanceTo(bot.position) < bot.userData.radius + 2) {
                    if (callbacks.onBotHit) callbacks.onBotHit(bot);
                    this.scene.remove(m);
                    this.meteorites.splice(i, 1);
                    hitBot = true;
                    break;
                }
            }
            if (hitBot) continue;
        }

        for(let i = this.mines.length - 1; i >= 0; i--) {
            const m = this.mines[i];
            m.userData.timer += dt;
            if(m.userData.timer > 1.0) m.userData.armed = true;
            const s = 1.0 + Math.sin(m.userData.timer * 10) * 0.2;
            m.scale.setScalar(s);
            m.material.uniforms.uTime.value += dt;
            
            if(m.userData.armed) {
                bots.forEach(b => {
                    if(b.position.distanceTo(m.position) < 3.0) {
                        callbacks.onMineExplode(b, m.position);
                        this.scene.remove(m);
                        this.mines.splice(i, 1);
                    }
                });
            }
        }

        for(let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= dt;
            p.mesh.position.addScaledVector(p.velocity, dt);
            
            if(p.life <= 0) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }

            if(p.team === 'red' && p.mesh.position.distanceTo(player.mesh.position) < player.mesh.scale.x) {
                if(player.data.shieldTime <= 0) {
                    callbacks.onPlayerHit(20);
                }
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }

    reset() {
        this.meteorites.forEach(m => this.scene.remove(m));
        this.meteorites.length = 0;
        this.mines.forEach(m => this.scene.remove(m));
        this.mines.length = 0;
        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.projectiles.length = 0;
    }
}
