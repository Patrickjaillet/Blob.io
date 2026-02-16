import * as THREE from 'three';
import { vertexShaderBlob, fragmentShaderBlob } from './fx_shaders.js';

export class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.bases = [];
        this.flags = [];
        this.turrets = [];
        this.spawnArea = 200;
    }

    init(mode) {
        this.initObstacles();
        if (mode === 'CTF') this.initCTF();
        if (mode === 'CTF') this.initTurrets();
    }

    initObstacles() {
        const obsMat = new THREE.ShaderMaterial({
            vertexShader: vertexShaderBlob,
            fragmentShader: fragmentShaderBlob,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x000000) },
                uRimColor: { value: new THREE.Color(0xff0000) },
                uNoiseFreq: { value: 1.0 },
                uNoiseAmp: { value: 0.3 },
                uSkinType: { value: 0 },
                uDamage: { value: 0.0 },
                uShield: { value: 0.0 },
                uStealth: { value: 0.0 },
                uMagnet: { value: 0.0 }
            },
            transparent: true
        });
        const obsGeo = new THREE.IcosahedronGeometry(1, 64);
        for(let i=0; i<5; i++) {
            const obs = new THREE.Mesh(obsGeo, obsMat.clone());
            const size = 5 + Math.random() * 5;
            obs.scale.setScalar(size);
            obs.position.set((Math.random()-0.5)*this.spawnArea, 1, (Math.random()-0.5)*this.spawnArea);
            obs.userData = { radius: size * 0.6, baseScale: size };
            this.scene.add(obs);
            this.obstacles.push(obs);
        }
    }

    initCTF() {
        const baseGeo = new THREE.RingGeometry(10, 12, 32);
        const flagGeo = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
        
        const blueBase = new THREE.Mesh(baseGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }));
        blueBase.rotation.x = -Math.PI/2;
        blueBase.position.set(-80, 0.1, 0);
        this.scene.add(blueBase);
        this.bases.push({ mesh: blueBase, team: 'blue', pos: new THREE.Vector3(-80, 0, 0) });

        const redBase = new THREE.Mesh(baseGeo, new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }));
        redBase.rotation.x = -Math.PI/2;
        redBase.position.set(80, 0.1, 0);
        this.scene.add(redBase);
        this.bases.push({ mesh: redBase, team: 'red', pos: new THREE.Vector3(80, 0, 0) });

        const blueFlag = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
        blueFlag.position.set(-80, 2, 0);
        this.scene.add(blueFlag);
        this.flags.push({ mesh: blueFlag, team: 'blue', home: new THREE.Vector3(-80, 2, 0), carrier: null });

        const redFlag = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        redFlag.position.set(80, 2, 0);
        this.scene.add(redFlag);
        this.flags.push({ mesh: redFlag, team: 'red', home: new THREE.Vector3(80, 2, 0), carrier: null });
    }

    initTurrets() {
        this.createTurret(-90, 15, 'blue');
        this.createTurret(-90, -15, 'blue');
        this.createTurret(90, 15, 'red');
        this.createTurret(90, -15, 'red');
    }

    createTurret(x, z, team) {
        const geo = new THREE.CylinderGeometry(1, 1.5, 4, 8);
        const mat = new THREE.MeshBasicMaterial({ color: team === 'blue' ? 0x0088ff : 0xff4400, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 2, z);
        this.scene.add(mesh);
        this.turrets.push({ mesh, team, cooldown: 0, pos: new THREE.Vector3(x, 2, z) });
    }

    update(dt, player, bots, callbacks, hazardManager) {
        this.obstacles.forEach(obs => {
            obs.material.uniforms.uTime.value += dt;
            obs.rotation.y += dt * 0.2;
            const pulse = 1.0 + Math.sin(obs.material.uniforms.uTime.value * 3.0) * 0.1;
            obs.scale.setScalar(obs.userData.baseScale * pulse);

            const dist = player.mesh.position.distanceTo(obs.position);
            if (dist < 40) {
                const pull = new THREE.Vector3().subVectors(obs.position, player.mesh.position).normalize();
                player.mesh.position.add(pull.multiplyScalar((40 - dist) * dt * 0.5));
            }

            if (dist < player.mesh.scale.x + obs.userData.radius) {
                if (player.data.shieldTime > 0) {
                    const push = new THREE.Vector3().subVectors(player.mesh.position, obs.position).normalize();
                    player.mesh.position.add(push.multiplyScalar(5.0));
                } else {
                    callbacks.onGameOver();
                }
            }
        });

        this.flags.forEach(flag => {
            flag.mesh.rotation.y += dt * 2;
            if (flag.carrier) {
                flag.mesh.position.copy(flag.carrier.position || flag.carrier.mesh.position);
                flag.mesh.position.y = 3;
                if (flag.carrier === player) {
                    const myBase = this.bases.find(b => b.team === 'blue');
                    if (player.mesh.position.distanceTo(myBase.pos) < 10) {
                        callbacks.onFlagCapture(flag);
                        flag.carrier = null;
                        flag.mesh.position.copy(flag.home);
                        player.data.hasFlag = false;
                    }
                }
            } else {
                if (flag.team === 'red' && !player.data.hasFlag) {
                    if (player.mesh.position.distanceTo(flag.mesh.position) < 3) {
                        flag.carrier = player;
                        player.data.hasFlag = true;
                        callbacks.onFlagStolen(flag);
                    }
                }
            }
        });

        this.turrets.forEach(t => {
            t.mesh.rotation.y += dt;
            t.cooldown -= dt;
            if(t.cooldown <= 0) {
                let target = null;
                if(t.team === 'red') {
                    if(player.mesh.position.distanceTo(t.pos) < 40) target = player.mesh;
                } else {
                    let minDist = 40;
                    let closestBot = null;
                    bots.forEach(b => {
                        const d = b.position.distanceTo(t.pos);
                        if(d < minDist) {
                            minDist = d;
                            closestBot = b;
                        }
                    });
                    target = closestBot;
                }
                
                if(target) {
                    const dir = new THREE.Vector3().subVectors(target.position, t.pos).normalize();
                    dir.y = 0;
                    hazardManager.spawnProjectile(t.pos, dir, t.team);
                    t.cooldown = 1.5;
                }
            }
        });
    }

    clear() {
        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];
        this.bases.forEach(b => this.scene.remove(b.mesh));
        this.bases = [];
        this.flags.forEach(f => this.scene.remove(f.mesh));
        this.flags = [];
        this.turrets.forEach(t => this.scene.remove(t.mesh));
        this.turrets = [];
    }

    reset() {
        this.flags.forEach(f => {
            f.carrier = null;
            f.mesh.position.copy(f.home);
        });
    }

    getSafePosition(radius, playerPos) {
        let pos = new THREE.Vector3();
        let safe = false;
        let attempts = 0;
        while(!safe && attempts < 100) {
            pos.set(playerPos.x + (Math.random()-0.5)*this.spawnArea, 1, playerPos.z + (Math.random()-0.5)*this.spawnArea);
            safe = true;
            for(let obs of this.obstacles) {
                if(pos.distanceTo(obs.position) < radius + obs.userData.radius + 15) {
                    safe = false;
                    break;
                }
            }
            attempts++;
        }
        return pos;
    }
}
