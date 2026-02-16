export class UIManager {
    constructor(callbacks) {
        this.screens = {
            intro: document.getElementById('intro-screen'),
            title: document.getElementById('game-title'),
            controls: document.getElementById('intro-controls'),
            modes: document.getElementById('mode-select'),
            gameover: document.getElementById('gameover-screen'),
            settings: document.getElementById('settings-modal')
        };
        this.huds = {
            score: document.getElementById('score-hud'),
            combo: document.getElementById('combo-hud'),
            boost: document.getElementById('boost-hud'),
            wave: document.getElementById('wave-hud'),
            boostFill: document.getElementById('boost-fill'),
            boostText: document.getElementById('boost-text'),
            leaderboard: document.getElementById('leaderboard'),
            leaderboardList: document.getElementById('leaderboard-list'),
            compass: document.getElementById('compass'),
            compassArrow: document.getElementById('compass-arrow'),
            compassLabel: document.getElementById('compass-label'),
            powerups: {
                shield: document.getElementById('icon-shield'),
                stealth: document.getElementById('icon-stealth'),
                vision: document.getElementById('icon-vision'),
                magnet: document.getElementById('icon-magnet')
            }
        };
        this.goStats = {
            mass: document.getElementById('go-mass'),
            time: document.getElementById('go-time'),
            kills: document.getElementById('go-kills'),
            wave: document.getElementById('go-wave')
        };
        this.textLayer = document.getElementById('text-layer');
        this.floatingMsgs = [];
        
        this.startBtn = document.getElementById('start-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.menuBtn = document.getElementById('menu-btn');
        this.skipBtn = document.getElementById('skip-intro-btn');
        this.creditsBtn = document.getElementById('credits-btn');
        this.creditsSection = document.getElementById('credits-section');

        this.bindEvents(callbacks);
    }

    bindEvents(callbacks) {
        this.startBtn.addEventListener('click', () => callbacks.onStart());
        document.getElementById('restart-btn').addEventListener('click', () => callbacks.onRestart());
        this.menuBtn.addEventListener('click', () => callbacks.onMenu());
        this.settingsBtn.addEventListener('click', () => {
            this.screens.settings.style.display = 'flex';
            setTimeout(() => { this.screens.settings.style.opacity = '1'; this.screens.settings.style.pointerEvents = 'auto'; }, 10);
        });
        document.getElementById('close-settings-btn').addEventListener('click', () => {
            this.screens.settings.style.opacity = '0';
            this.screens.settings.style.pointerEvents = 'none';
            this.creditsSection.style.display = 'none'; // Reset credits
            setTimeout(() => { this.screens.settings.style.display = 'none'; }, 500);
        });

        this.creditsBtn.addEventListener('click', () => {
            const isHidden = this.creditsSection.style.display === 'none';
            this.creditsSection.style.display = isHidden ? 'block' : 'none';
        });

        document.getElementById('opt-bloom').addEventListener('change', (e) => callbacks.onSettingChange('bloom', e.target.checked));
        document.getElementById('opt-particles').addEventListener('change', (e) => callbacks.onSettingChange('particles', e.target.checked));
        document.getElementById('opt-audio').addEventListener('change', (e) => callbacks.onSettingChange('audio', e.target.checked));

        document.querySelectorAll('.skin-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                callbacks.onSkinSelect(parseInt(btn.dataset.skin));
            });
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                callbacks.onModeSelect(btn.dataset.mode);
            });
        });
        
        this.skipBtn.addEventListener('click', () => callbacks.onSkip());
    }

    showGame() {
        this.screens.intro.classList.remove('active');
        this.screens.gameover.classList.remove('active');
        this.huds.score.style.display = 'block';
        this.huds.leaderboard.style.display = 'block';
        this.huds.boost.style.display = 'block';
    }

    showIntro() {
        this.screens.intro.classList.add('active');
        this.screens.gameover.classList.remove('active');
        this.huds.score.style.display = 'none';
        this.huds.boost.style.display = 'none';
        this.huds.compass.style.display = 'none';
        this.huds.combo.style.display = 'none';
        this.huds.wave.style.display = 'none';
        this.huds.leaderboard.style.display = 'none';
    }

    showGameOver(stats) {
        this.screens.gameover.classList.add('active');
        this.huds.score.style.display = 'none';
        this.huds.boost.style.display = 'none';
        this.huds.compass.style.display = 'none';
        this.huds.combo.style.display = 'none';
        this.huds.wave.style.display = 'none';
        
        this.goStats.mass.innerText = Math.floor(stats.score);
        this.goStats.time.innerText = stats.time;
        this.goStats.kills.innerText = stats.kills;
        this.goStats.wave.innerText = stats.wave;
    }

    updateScore(score) {
        this.huds.score.innerText = `MASS: ${Math.floor(score)}`;
    }

    updateBoost(cooldown, score) {
        if (cooldown > 0) {
            const pct = Math.max(0, (1 - cooldown / 8.0) * 100);
            this.huds.boostFill.style.width = `%`;
            this.huds.boostFill.style.backgroundColor = '#555';
            this.huds.boostText.innerText = "RECHARGING...";
        } else {
            this.huds.boostFill.style.width = '100%';
            if (score > 20) {
                this.huds.boostFill.style.backgroundColor = '#0ff';
                this.huds.boostText.innerText = "BOOST READY [SPACE]";
            } else {
                this.huds.boostFill.style.backgroundColor = '#ff0055';
                this.huds.boostText.innerText = "NEED MASS";
            }
        }
    }

    updateWave(wave) {
        this.huds.wave.style.display = wave > 0 ? 'block' : 'none';
        this.huds.wave.innerText = `WAVE: ${wave}`;
    }

    updateCombo(count) {
        if (count > 0) {
            const multiplier = 1 + (count * 0.1);
            this.huds.combo.innerText = `COMBO x${multiplier.toFixed(1)}`;
            this.huds.combo.style.display = 'block';
            this.huds.combo.style.transform = `scale(${1 + Math.min(count*0.05, 0.5)}) skewX(-10deg)`;
        } else {
            this.huds.combo.style.display = 'none';
        }
    }

    updateCompass(playerPos, targetPos, isDanger) {
        this.huds.compass.style.display = 'block';
        const dx = targetPos.x - playerPos.x;
        const dz = targetPos.z - playerPos.z;
        const angle = Math.atan2(dz, dx);
        this.huds.compassArrow.style.transform = `rotate(${angle * (180/Math.PI) + 90}deg)`;
        
        if(isDanger) {
            this.huds.compassLabel.innerText = "DANGER";
            this.huds.compassArrow.style.color = "#ff0055";
            this.huds.compassArrow.style.textShadow = "0 0 10px #ff0055";
        } else {
            this.huds.compassLabel.innerText = "CENTER";
            this.huds.compassArrow.style.color = "#00ffff";
            this.huds.compassArrow.style.textShadow = "0 0 10px #00ffff";
        }
    }

    updateLeaderboard(list) {
        this.huds.leaderboardList.innerHTML = list.map(item => 
            `<li style="color: ${item.isPlayer ? '#0ff' : '#fff'}">${item.name}: ${item.mass}</li>`
        ).join('');
    }

    updatePowerUps(data) {
        if(data.shield) this.huds.powerups.shield.classList.add('active');
        else this.huds.powerups.shield.classList.remove('active');
        
        if(data.stealth) this.huds.powerups.stealth.classList.add('active');
        else this.huds.powerups.stealth.classList.remove('active');
        
        if(data.vision) this.huds.powerups.vision.classList.add('active');
        else this.huds.powerups.vision.classList.remove('active');

        if(data.magnet) this.huds.powerups.magnet.classList.add('active');
        else this.huds.powerups.magnet.classList.remove('active');
    }

    spawnFloatingText(text, position, color, camera) {
        const el = document.createElement('div');
        el.className = 'floating-msg';
        el.innerText = text;
        el.style.color = '#' + color.getHexString();
        this.textLayer.appendChild(el);
        
        this.floatingMsgs.push({
            element: el,
            position: position.clone(),
            life: 1.0,
            offsetY: 0
        });
    }

    updateFloatingTexts(dt, camera) {
        for (let i = this.floatingMsgs.length - 1; i >= 0; i--) {
            const msg = this.floatingMsgs[i];
            msg.life -= dt;
            msg.offsetY += dt * 2.0;
            
            if (msg.life <= 0) {
                msg.element.remove();
                this.floatingMsgs.splice(i, 1);
                continue;
            }

            const tempV = msg.position.clone();
            tempV.y += msg.offsetY;
            tempV.project(camera);

            const x = (tempV.x * .5 + .5) * window.innerWidth;
            const y = (-(tempV.y * .5) + .5) * window.innerHeight;

            msg.element.style.transform = `translate(-50%, -50%)`;
            msg.element.style.left = `px`;
            msg.element.style.top = `px`;
            msg.element.style.opacity = msg.life;
            msg.element.style.transform = `scale(${1 + (1-msg.life)})`;
            
            if (tempV.z > 1) msg.element.style.display = 'none';
            else msg.element.style.display = 'block';
        }
    }

    clearFloatingTexts() {
        this.floatingMsgs.forEach(msg => msg.element.remove());
        this.floatingMsgs.length = 0;
    }

    setCinematicMode(active) {
        if (active) {
            this.screens.title.style.opacity = '0';
            this.screens.controls.style.opacity = '0';
            this.screens.controls.style.pointerEvents = 'none';
            this.screens.modes.style.opacity = '0';
            this.startBtn.style.display = 'none';
            this.settingsBtn.style.display = 'none';
        } else {
            this.screens.controls.style.opacity = '1';
            this.screens.controls.style.pointerEvents = 'auto';
            this.screens.modes.style.opacity = '1';
            this.startBtn.style.display = 'block';
            this.settingsBtn.style.display = 'block';
            this.showSkipButton(false);
        }
    }

    showTitle(visible) {
        this.screens.title.style.opacity = visible ? '1' : '0';
    }

    showSkipButton(visible) {
        this.skipBtn.style.display = visible ? 'block' : 'none';
        if(visible) {
            setTimeout(() => this.skipBtn.style.opacity = '1', 10);
        } else {
            this.skipBtn.style.opacity = '0';
        }
    }
}
