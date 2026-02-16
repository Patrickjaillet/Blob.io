import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { NightVisionShader } from './fx_shaders.js';

export class PostFX {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);
        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0;
        this.bloomPass.strength = 0.5; // Reduced bloom strength for sharpness
        this.bloomPass.radius = 0.5;
        this.composer.addPass(this.bloomPass);

        this.nightVisionPass = new ShaderPass(NightVisionShader);
        this.nightVisionPass.enabled = false;
        this.composer.addPass(this.nightVisionPass);

        this.glitchPass = new GlitchPass();
        this.glitchPass.enabled = false;
        this.composer.addPass(this.glitchPass);
        
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    update(dt) {
        this.nightVisionPass.uniforms.time.value += dt;
    }

    render() {
        this.composer.render();
    }

    setBloom(enabled) {
        this.bloomPass.enabled = enabled;
    }

    setNightVision(enabled) {
        this.nightVisionPass.enabled = enabled;
    }

    setGlitch(enabled) {
        this.glitchPass.enabled = enabled;
    }
}
