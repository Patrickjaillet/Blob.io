import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.filter = this.ctx.createBiquadFilter();
        
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 22000;
        
        this.masterGain.connect(this.filter);
        this.filter.connect(this.ctx.destination);
        
        this.humOsc = null;
        this.humGain = null;
        this.musicNodes = [];
    }

    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    toggleMute(isMuted) {
        const val = isMuted ? 0 : 1;
        this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }

    updateDamageFilter(damage) {
        const targetFreq = 100 + (22000 - 100) * (1.0 - damage * 0.8);
        this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    }

    initHum() {
        if (this.humOsc) return;
        this.humOsc = this.ctx.createOscillator();
        this.humGain = this.ctx.createGain();
        this.humOsc.type = 'sine';
        this.humOsc.frequency.value = 60;
        this.humOsc.connect(this.humGain);
        this.humGain.connect(this.masterGain);
        this.humGain.gain.value = 0;
        this.humOsc.start();
    }

    updateHum(playerPos, obstacles) {
        if (!this.humGain) return;
        let minObsDist = Infinity;
        obstacles.forEach(obs => {
            const dist = playerPos.distanceTo(obs.position);
            minObsDist = Math.min(minObsDist, dist - obs.userData.radius);
        });
        const vol = Math.max(0, 1 - (minObsDist / 40));
        this.humGain.gain.setTargetAtTime(vol * 0.4, this.ctx.currentTime, 0.1);
        this.humOsc.frequency.setTargetAtTime(60 + vol * 40, this.ctx.currentTime, 0.1);
    }

    initMusic() {
        if (this.musicNodes.length > 0) return;

        const bpm = 120;
        const beatTime = 60 / bpm;

        // Bass Line
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = 55; // A1
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassGain.gain.value = 0.1;
        bassOsc.start();
        
        // LFO for Bass (Wobble)
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 1 / beatTime;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 800;
        lfoGain.connect(bassFilter.frequency);
        bassOsc.disconnect();
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        lfo.start();

        this.musicNodes.push(bassOsc, lfo, bassGain, lfoGain, bassFilter);
    }

    playEat(pitch = 1.0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'triangle';
        
        const baseFreq = 200 * pitch + Math.random() * 50;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.25, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    stopAll() {
        if (this.humOsc) {
            this.humOsc.stop();
            this.humOsc.disconnect();
            this.humOsc = null;
            this.humGain = null;
        }

        this.musicNodes.forEach(node => {
            try {
                node.stop();
            } catch (e) {}
            node.disconnect();
        });
        this.musicNodes = [];
    }
}
