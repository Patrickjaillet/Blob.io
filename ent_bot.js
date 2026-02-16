import * as THREE from 'three';
import { vertexShaderBlob, fragmentShaderBlob } from './fx_shaders.js';

export class BotManager {
    constructor(scene) {
        this.scene = scene;
        this.bots = [];
        this.geometry = new THREE.IcosahedronGeometry(1, 64);
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

    spawn(count, area, mode) {
        for(let i=0; i<count; i++) {
            const size = 0.5 + Math.random() * 3.5;
            let color = Math.random() * 0xffffff;
            let team = null;

            if (mode === 'TDM') {
                team = Math.random() < 0.5 ? 'blue' : 'red';
                color = team === 'blue' ? 0x0000ff : 0xff0000;
            } else if (mode === 'SURVIVAL') {
                team = 'red';
                color = 0xff0000;
            }

            const b = new THREE.Mesh(this.geometry, this.createMaterial(color));
            b.scale.set(size, size, size);
            b.position.set((Math.random()-0.5)*area, 1, (Math.random()-0.5)*area);
            b.userData = { radius: size, team: team };
            this.scene.add(b);
            this.bots.push(b);
        }
    }

    update(dt, player, foods, area, mode) {
        this.bots.forEach(bot => {
            bot.material.uniforms.uTime.value += dt;
            const bRadius = bot.userData.radius;
            let target = null;
            let targetDist = Infinity;
            let isFleeing = false;
            let isHunting = false;

            const distToPlayer = bot.position.distanceTo(player.mesh.position);
            const pRadius = player.mesh.scale.x;

            let isTeammate = false;
            if (mode === 'TDM' && bot.userData.team === 'blue') isTeammate = true;

            // Check Player
            if (!isTeammate) {
                if (pRadius > bRadius * 1.05) {
                    if (distToPlayer < 100 && player.data.stealthTime <= 0) {
                        isFleeing = true;
                        target = player.mesh;
                        targetDist = distToPlayer;
                    }
                } else if (pRadius * 1.05 < bRadius) {
                    if (distToPlayer < 120) {
                        target = player.mesh;
                        targetDist = distToPlayer;
                        isHunting = true;
                    }
                }
            }

            // Check Other Bots (Aggression)
            this.bots.forEach(other => {
                if (other === bot) return;
                if (mode === 'TDM' && other.userData.team === bot.userData.team) return;

                const d = bot.position.distanceTo(other.position);
                const oRadius = other.userData.radius;

                if (oRadius > bRadius * 1.05) {
                    // Flee bigger bots
                    if (d < 80 && (!isFleeing || d < targetDist)) {
                        isFleeing = true;
                        target = other;
                        targetDist = d;
                        isHunting = false;
                    }
                } else if (oRadius * 1.05 < bRadius) {
                    // Chase smaller bots
                    if (!isFleeing && d < 120 && d < targetDist) {
                        target = other;
                        targetDist = d;
                        isHunting = true;
                    }
                }
            });

            if (!isFleeing) {
                foods.forEach(f => {
                    const d = bot.position.distanceTo(f.position);
                    // Only eat food if not hunting, or if food is very close (opportunistic)
                    if (d < 60 && (d < targetDist || (isHunting && d < 10))) {
                        target = f;
                        targetDist = d;
                        if (d < targetDist) isHunting = false; // Switch to food if closer/better
                    }
                });
            }

            const moveDir = new THREE.Vector3();
            if (target) {
                moveDir.subVectors(target.position, bot.position);
                moveDir.y = 0;
                moveDir.normalize();
                if (isFleeing) moveDir.negate();
            } else {
                moveDir.set(Math.sin(bot.material.uniforms.uTime.value * 0.1), 0, Math.cos(bot.material.uniforms.uTime.value * 0.1));
            }

            let speedMult = 1.0;
            if (isFleeing) speedMult = 1.4;
            else if (isHunting) speedMult = 1.2;

            const bSpeed = (12.0 / (bRadius * 0.5 + 1.0)) * dt * speedMult;
            bot.position.add(moveDir.multiplyScalar(bSpeed));
            
            // Boundary Force (Soft Border)
            const distFromCenter = bot.position.length();
            if (distFromCenter > area * 0.9) {
                const pushBack = bot.position.clone().negate().normalize();
                bot.position.add(pushBack.multiplyScalar(dt * 10));
            }

            if (bot.position.distanceTo(player.mesh.position) > area * 1.2) {
                this.respawn(bot, area, player.mesh.position);
            }
        });
    }

    respawn(bot, area, center) {
        bot.position.set(center.x + (Math.random()-0.5)*area, 1, center.z + (Math.random()-0.5)*area);
        bot.userData.radius = 0.5 + Math.random();
        bot.scale.setScalar(bot.userData.radius);
        
        // Keep team color if TDM
        if (bot.userData.team === 'blue') {
            bot.material.uniforms.uColor.value.setHex(0x0000ff);
        } else if (bot.userData.team === 'red') {
            bot.material.uniforms.uColor.value.setHex(0xff0000);
        } else {
            bot.material.uniforms.uColor.value.setHex(Math.random() * 0xffffff);
        }
    }

    reset(area) {
        this.bots.forEach(b => {
            b.position.set((Math.random()-0.5)*area, 1, (Math.random()-0.5)*area);
            b.userData.radius = 0.5 + Math.random();
            b.scale.setScalar(b.userData.radius);
        });
    }
}
