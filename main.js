import * as THREE from 'three';
import { CoreEngine } from './core_engine.js';
import { PostFX } from './fx_post.js';
import { InputSystem } from './sys_input.js';
import { AudioManager } from './sys_audio.js';
import { Player } from './ent_player.js';
import { BotManager } from './ent_bot.js';
import { FoodManager } from './ent_food.js';
import { WorldManager } from './ent_world.js';
import { HazardManager } from './ent_hazards.js';
import { PowerUpManager } from './ent_powerups.js';
import { UIManager } from './ui_manager.js';
import { CinematicSystem } from './sys_cinematic.js';
import { Quadtree } from './sys_quadtree.js';
import { ObjectPool } from './sys_pool.js';

const STATE = { CINEMATIC: 0, INTRO: 1, GAME: 2, GAMEOVER: 3 };
let currentState = STATE.CINEMATIC;
let gameMode = 'FFA';
let score = 100;
let comboCount = 0;
let comboTimer = 0;
let boostCooldown = 0;
let speedBoostTimer = 0;
let slowMoTimer = 0;
let timeScale = 1.0;
let survivalWave = 1;
let kills = 0;
let startTime = 0;
const SPAWN_AREA = 200;

const core = new CoreEngine();
const audio = new AudioManager();
const postFX = new PostFX(core.renderer, core.scene, core.camera);
const input = new InputSystem(core.camera, core.scene);
const ui = new UIManager({
    onStart: startGame,
    onRestart: restartGame,
    onMenu: goToMenu,
    onSettingChange: updateSettings,
    onSkinSelect: (skin) => player.setSkin(skin),
    onModeSelect: (mode) => { gameMode = mode; },
    onSkip: () => cinematic.end()
});

const player = new Player(core.scene);
const botManager = new BotManager(core.scene);
const foodManager = new FoodManager(core.scene);
const worldManager = new WorldManager(core.scene);
const hazardManager = new HazardManager(core.scene);
const powerUpManager = new PowerUpManager(core.scene);

const quadtree = new Quadtree({ x: 0, z: 0, width: SPAWN_AREA, height: SPAWN_AREA }, 4);

const cinematic = new CinematicSystem(core.camera, core.scene, ui, () => {
    currentState = STATE.INTRO;
}, (pos) => {
    createHeroExplosion(pos);
});

const particleGeo = new THREE.IcosahedronGeometry(0.3, 0);
const particlePool = new ObjectPool(
    () => {
        return new THREE.Mesh(particleGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    },
    (p) => {
        p.visible = true;
        p.scale.setScalar(1);
    }
);

function getParticles() {
    return particlePool.active;
}

// Start Cinematic
cinematic.start();

input.callbacks.onBoost = () => {
    if(boostCooldown <= 0 && score > 20) {
        speedBoostTimer = 5.0;
        boostCooldown = 8.0;
        score -= 10;
        player.mesh.scale.setScalar(1 + score * 0.005);
        ui.updateScore(score);
        player.triggerDamage();
    }
};

input.callbacks.onMine = () => {
    if(score > 25) {
        hazardManager.spawnMine(player.mesh.position);
        score -= 15;
        player.mesh.scale.setScalar(1 + score * 0.005);
        ui.updateScore(score);
        ui.spawnFloatingText("-15 (MINE)", player.mesh.position, new THREE.Color(0xff0000), core.camera);
    } else {
        ui.spawnFloatingText("NEED MASS", player.mesh.position, new THREE.Color(0xff0000), core.camera);
    }
};

const clock = new THREE.Clock();
animate();

function startGame() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {});
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    }
    audio.resume();
    audio.initHum();
    audio.initMusic();
    currentState = STATE.GAME;
    ui.showGame();
    resetGame();
}

function restartGame() {
    audio.resume();
    audio.initMusic();
    currentState = STATE.GAME;
    ui.showGame();
    resetGame();
}

function goToMenu() {
    currentState = STATE.INTRO;
    ui.showIntro();
    audio.stopAll();
}

function resetGame() {
    score = 100;
    comboCount = 0;
    comboTimer = 0;
    speedBoostTimer = 0;
    boostCooldown = 0;
    slowMoTimer = 0;
    timeScale = 1.0;
    kills = 0;
    startTime = Date.now();
    survivalWave = 1;
    
    player.reset(worldManager.getSafePosition(1, player.mesh.position));
    worldManager.clear();
    worldManager.init(gameMode);
    
    botManager.reset(SPAWN_AREA);
    botManager.bots.forEach(b => core.scene.remove(b));
    botManager.bots = [];
    botManager.spawn(gameMode === 'SURVIVAL' ? 10 : 50, SPAWN_AREA, gameMode);
    
    foodManager.reset(SPAWN_AREA);
    foodManager.spawn(100, SPAWN_AREA);
    hazardManager.reset();
    powerUpManager.reset();
    
    getParticles().forEach(p => core.scene.remove(p));
    particlePool.clear();
    
    ui.updateScore(score);
    ui.updateWave(gameMode === 'SURVIVAL' ? survivalWave : 0);
    ui.clearFloatingTexts();
    postFX.setGlitch(false);
    postFX.setNightVision(false);
}

function updateSettings(key, value) {
    if(key === 'bloom') postFX.setBloom(value);
    if(key === 'audio') audio.toggleMute(!value);
}

function handleScoreChange(amount, pos, color) {
    if (amount > 0) {
        comboCount++;
        comboTimer = 3.0;
        const multiplier = 1 + (comboCount * 0.1);
        ui.updateCombo(comboCount);
        if (comboCount % 5 === 0) slowMoTimer = 2.0;
        amount *= multiplier;
    }
    
    score += amount;
    if (pos && color) {
        const prefix = amount > 0 ? '+' : '';
        ui.spawnFloatingText(`${prefix}${Math.floor(amount)}`, pos, color, core.camera);
    }
    
    if (score < 10) {
        triggerGameOver();
    } else {
        player.mesh.scale.setScalar(1 + score * 0.005);
        ui.updateScore(score);
    }
}

function triggerGameOver() {
    currentState = STATE.GAMEOVER;
    const timeAlive = Date.now() - startTime;
    const minutes = Math.floor(timeAlive / 60000);
    const seconds = Math.floor((timeAlive % 60000) / 1000);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    ui.showGameOver({ score: score, time: timeStr, kills: kills, wave: survivalWave });
    
    audio.stopAll();
    postFX.setGlitch(true);
    player.mesh.visible = false;
}

function updateGame(dt) {
    const target = input.getTargetPosition(player.mesh.position);
    let speed = 15.0 / (player.mesh.scale.x * 0.5 + 1.0);
    if (speedBoostTimer > 0) {
        speed *= 1.5;
        speedBoostTimer -= dt;
    }
    player.mesh.position.add(target.multiplyScalar(speed * dt));

    // Rebuild Quadtree
    quadtree.clear();
    quadtree.boundary = { x: 0, z: 0, width: SPAWN_AREA, height: SPAWN_AREA }; // Reset boundary if needed
    botManager.bots.forEach(b => quadtree.insert(b));
    foodManager.foods.forEach(f => quadtree.insert(f));
    // Player is handled separately or inserted if needed for bot AI queries

    // Camera Follow Logic
    const aspect = window.innerWidth / window.innerHeight;
    const isPortrait = aspect < 1;
    const baseDist = 40;
    const camDist = isPortrait ? baseDist * 1.8 : baseDist;
    const camHeight = Math.max(camDist, player.mesh.scale.x * 30 + (isPortrait ? 50 : 30)); // Increased height to prevent clipping
    
    core.camera.position.x = THREE.MathUtils.lerp(core.camera.position.x, player.mesh.position.x, 0.1);
    core.camera.position.z = THREE.MathUtils.lerp(core.camera.position.z, player.mesh.position.z + camDist, 0.1);
    core.camera.position.y = THREE.MathUtils.lerp(core.camera.position.y, camHeight, 0.1);
    core.camera.lookAt(player.mesh.position);

    player.update(dt);
    
    const allBlobs = [player.mesh, ...botManager.bots];
    core.update(dt, player.mesh.position, allBlobs);
    
    audio.updateHum(player.mesh.position, worldManager.obstacles);
    audio.updateDamageFilter(Math.min(player.uniforms.uDamage.value, 1.25));

    botManager.update(dt, player, foodManager.foods, SPAWN_AREA, gameMode);
    foodManager.update(dt, player.mesh.position, SPAWN_AREA);
    
    worldManager.update(dt, player, botManager.bots, {
        onGameOver: triggerGameOver,
        onFlagStolen: (flag) => ui.spawnFloatingText("FLAG STOLEN!", player.mesh.position, new THREE.Color(0xff0000), core.camera),
        onFlagCapture: (flag) => {
            handleScoreChange(1000, player.mesh.position, new THREE.Color(0x00ff00));
            ui.spawnFloatingText("FLAG CAPTURED!", player.mesh.position, new THREE.Color(0x00ff00), core.camera);
            audio.playEat();
        }
    }, hazardManager);

    hazardManager.update(dt, player, botManager.bots, {
        onGameOver: triggerGameOver,
        onPlayerHit: (dmg) => {
            player.triggerDamage();
            handleScoreChange(-dmg, player.mesh.position, new THREE.Color(0xff0000));
        },
        onMineExplode: (bot, pos) => {
            bot.userData.radius *= 0.5;
            if(bot.userData.radius < 0.5) botManager.respawn(bot, SPAWN_AREA, player.mesh.position);
            bot.scale.setScalar(bot.userData.radius);
            const push = new THREE.Vector3().subVectors(bot.position, pos).normalize();
            bot.position.add(push.multiplyScalar(10.0));
        },
        onBotHit: (bot) => {
            createEatParticles(bot.position, new THREE.Color(0xff4400));
            botManager.respawn(bot, SPAWN_AREA, player.mesh.position);
        }
    });

    powerUpManager.update(dt, player, {
        onPickup: (type, pos) => {
            slowMoTimer = 2.0;
            if(type === 'shield') {
                player.data.shieldTime = 10.0;
                ui.spawnFloatingText("SHIELD ACTIVE", pos, new THREE.Color(0x00ffff), core.camera);
            } else if (type === 'stealth') {
                player.data.stealthTime = 10.0;
                ui.spawnFloatingText("STEALTH ACTIVE", pos, new THREE.Color(0xaa00ff), core.camera);
            } else if (type === 'vision') {
                player.data.visionTime = 10.0;
                postFX.setNightVision(true);
                ui.spawnFloatingText("NIGHT VISION", pos, new THREE.Color(0x00ff00), core.camera);
            } else {
                player.data.magnetTime = 10.0;
                ui.spawnFloatingText("MAGNET ACTIVE", pos, new THREE.Color(0xffff00), core.camera);
            }
        }
    });

    // Optimized Food Collision using Quadtree
    const range = { x: player.mesh.position.x, z: player.mesh.position.z, width: player.mesh.scale.x + 20, height: player.mesh.scale.x + 20 };
    const nearbyFood = quadtree.query(range).filter(obj => foodManager.foods.includes(obj));
    nearbyFood.forEach(f => {
        if(player.mesh.position.distanceTo(f.position) < player.mesh.scale.x + 1.0) {
            // Pitch: Mass (Yellow) = Grave (0.8), Normal = Aigu (1.2)
            const pitch = f.userData.type === 'mass' ? 0.8 : 1.2;
            audio.playEat(pitch);
            createEatParticles(f.position, f.material.uniforms.uColor.value);

            if (f.userData.type === 'speed') speedBoostTimer = 5.0;
            const amount = f.userData.type === 'mass' ? 50 : 10;
            handleScoreChange(amount, f.position, f.material.uniforms.uColor.value);
            foodManager.respawn(f, SPAWN_AREA, player.mesh.position);
        }
        
        // Magnet Logic
        if (player.data.magnetTime > 0 && player.mesh.position.distanceTo(f.position) < 20) {
            const pull = new THREE.Vector3().subVectors(player.mesh.position, f.position).normalize();
            f.position.add(pull.multiplyScalar(dt * 30));
        }
    });

    // Survival Wave Logic
    if (gameMode === 'SURVIVAL' && botManager.bots.length < 3) {
        survivalWave++;
        ui.updateWave(survivalWave);
        ui.spawnFloatingText(`WAVE ${survivalWave}`, player.mesh.position, new THREE.Color(0xff0000), core.camera);
        botManager.spawn(5 + survivalWave * 2, SPAWN_AREA, gameMode);
    }

    // Optimized Bot Collision using Quadtree
    const nearbyBots = quadtree.query(range).filter(obj => botManager.bots.includes(obj));
    nearbyBots.forEach(bot => {
        const dist = player.mesh.position.distanceTo(bot.position);
        if(dist < player.mesh.scale.x + bot.userData.radius) {
            if(player.mesh.scale.x > bot.userData.radius) {
                audio.playEat(0.5); // Son très grave pour les bots
                createEatParticles(bot.position, bot.material.uniforms.uColor.value);
                kills++;
                handleScoreChange(50, bot.position, bot.material.uniforms.uColor.value);
                if (gameMode === 'SURVIVAL') {
                    core.scene.remove(bot);
                    botManager.bots.splice(botManager.bots.indexOf(bot), 1);
                } else {
                    botManager.respawn(bot, SPAWN_AREA, player.mesh.position);
                }
            } else {
                if (player.data.shieldTime > 0) {
                    const push = new THREE.Vector3().subVectors(player.mesh.position, bot.position).normalize();
                    player.mesh.position.add(push.multiplyScalar(5.0));
                } else {
                    triggerGameOver();
                }
            }
        }
    });

    // Bot vs Bot Collision (Cannibalism)
    for (let i = 0; i < botManager.bots.length; i++) {
        const b1 = botManager.bots[i];
        const botRange = { x: b1.position.x, z: b1.position.z, width: b1.userData.radius + 10, height: b1.userData.radius + 10 };
        const neighbors = quadtree.query(botRange).filter(obj => botManager.bots.includes(obj) && obj !== b1);
        for (let b2 of neighbors) {
            if (gameMode === 'TDM' && b1.userData.team === b2.userData.team) continue;

            const dist = b1.position.distanceTo(b2.position);
            if (dist < b1.userData.radius + b2.userData.radius) {
                if (b1.userData.radius > b2.userData.radius * 1.05) {
                    createEatParticles(b2.position, b2.material.uniforms.uColor.value);
                    b1.userData.radius += b2.userData.radius * 0.25;
                    b1.scale.setScalar(b1.userData.radius);
                    botManager.respawn(b2, SPAWN_AREA, player.mesh.position);
                } else if (b2.userData.radius > b1.userData.radius * 1.05) {
                    createEatParticles(b1.position, b1.material.uniforms.uColor.value);
                    b2.userData.radius += b1.userData.radius * 0.25;
                    b2.scale.setScalar(b2.userData.radius);
                    botManager.respawn(b1, SPAWN_AREA, player.mesh.position);
                }
            }
        }
        
        // Bot vs Food
        const foodNeighbors = quadtree.query(botRange).filter(obj => foodManager.foods.includes(obj));
        foodNeighbors.forEach(f => {
            if (b1.position.distanceTo(f.position) < b1.userData.radius) {
                b1.userData.radius += 0.02;
                b1.scale.setScalar(b1.userData.radius);
                foodManager.respawn(f, SPAWN_AREA, player.mesh.position);
            }
        });
    }

    // Particles Update
    const activeParticles = getParticles();
    for(let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.userData.life -= dt;
        p.position.addScaledVector(p.userData.velocity, dt);
        p.scale.setScalar(p.userData.life * 0.3);
        if(p.userData.life <= 0) {
            core.scene.remove(p);
            particlePool.release(p);
        }
    }

    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            comboCount = 0;
            ui.updateCombo(0);
        }
    }
    if (boostCooldown > 0) boostCooldown -= dt;
    ui.updateBoost(boostCooldown, score);
    ui.updatePowerUps({ shield: player.data.shieldTime > 0, stealth: player.data.stealthTime > 0, vision: player.data.visionTime > 0, magnet: player.data.magnetTime > 0 });
    if(player.data.visionTime <= 0) postFX.setNightVision(false);

    let nearestThreat = null;
    let minDist = Infinity;
    botManager.bots.forEach(b => {
        if (b.userData.radius > player.mesh.scale.x) {
            const d = player.mesh.position.distanceTo(b.position);
            if (d < minDist) {
                minDist = d;
                nearestThreat = b;
            }
        }
    });
    ui.updateCompass(player.mesh.position, nearestThreat ? nearestThreat.position : new THREE.Vector3(0,0,0), !!nearestThreat);

    if (Math.random() < 0.1) {
        const list = [];
        list.push({ name: "YOU", mass: Math.floor(player.mesh.scale.x * 100), isPlayer: true });
        botManager.bots.forEach((b, i) => list.push({ name: `BOT ${i+1}`, mass: Math.floor(b.userData.radius * 100), isPlayer: false }));
        list.sort((a, b) => b.mass - a.mass);
        ui.updateLeaderboard(list.slice(0, 5));
    }
}

function createEatParticles(pos, color) {
    for(let i=0; i<6; i++) {
        const p = particlePool.get();
        p.material.color.set(color);
        p.position.copy(pos);
        p.scale.setScalar(0.3);
        p.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        p.userData.life = 0.5 + Math.random() * 0.3;
        core.scene.add(p);
    }
}

function createHeroExplosion(pos) {
    for(let i=0; i<50; i++) {
        const p = particlePool.get();
        p.material.color.setHex(0x00ffff);
        p.position.copy(pos);
        p.scale.setScalar(0.5 + Math.random() * 0.5);
        p.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30
        );
        p.userData.life = 1.0 + Math.random() * 1.0;
        core.scene.add(p);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const realDt = clock.getDelta();
    
    if (slowMoTimer > 0) {
        timeScale = THREE.MathUtils.lerp(timeScale, 0.1, 0.1);
        slowMoTimer -= realDt;
    } else {
        timeScale = THREE.MathUtils.lerp(timeScale, 1.0, 0.1);
    }
    const dt = realDt * timeScale;

    if(currentState === STATE.GAME) {
        updateGame(dt);
        ui.updateFloatingTexts(realDt, core.camera);
    } else if (currentState === STATE.CINEMATIC) {
        cinematic.update(dt);
    } else if (currentState === STATE.INTRO) {
        const t = Date.now() * 0.0005;
        core.camera.position.x = Math.sin(t) * 40;
        core.camera.position.z = Math.cos(t) * 40;
        core.camera.position.y = 30;
        core.camera.lookAt(0, 0, 0);
        botManager.bots.forEach(b => b.material.uniforms.uTime.value += dt);
        
        // Update particles during intro
        const activeParticles = getParticles();
        for(let i = activeParticles.length - 1; i >= 0; i--) {
            const p = activeParticles[i];
            p.userData.life -= dt;
            p.position.addScaledVector(p.userData.velocity, dt);
            p.scale.setScalar(p.userData.life * 0.5);
            if(p.userData.life <= 0) {
                core.scene.remove(p);
                particlePool.release(p);
            }
        }
    }

    postFX.update(dt);
    postFX.render();
}
