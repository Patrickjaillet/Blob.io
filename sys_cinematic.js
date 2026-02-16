import * as THREE from 'three';
import { vertexShaderCinematic, fragmentShaderCinematic } from './fx_shaders.js';

export class CinematicSystem {
    constructor(camera, scene, ui, onComplete, onExplode) {
        this.camera = camera;
        this.scene = scene;
        this.ui = ui;
        this.onComplete = onComplete;
        this.onExplode = onExplode;
        this.active = false;
        this.time = 0;
        this.skipShown = false;
        this.exploded = false;

        // Hero Blob (The big one in the intro)
        this.geometry = new THREE.IcosahedronGeometry(1, 128);
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShaderCinematic,
            fragmentShader: fragmentShaderCinematic,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x000022) }, // Darker Deep Blue
                uRimColor: { value: new THREE.Color(0x00aaff) } // Brighter Cyan Rim
            },
            transparent: true,
            side: THREE.DoubleSide
        });
        this.hero = new THREE.Mesh(this.geometry, this.material);
        this.hero.visible = false;
        this.scene.add(this.hero);
    }

    start() {
        this.active = true;
        this.time = 0;
        this.exploded = false;
        this.skipShown = false;
        this.hero.visible = true;
        this.ui.setCinematicMode(true);
    }

    update(dt) {
        if (!this.active) return;
        this.time += dt;
        this.material.uniforms.uTime.value += dt;

        if (this.time > 3.0 && !this.skipShown) {
            this.ui.showSkipButton(true);
            this.skipShown = true;
        }

        // 20 Seconds Timeline
        if (this.time < 5) {
            // 0-5s: Birth - Slow rotation, mysterious
            const t = this.time / 5;
            this.hero.scale.setScalar(THREE.MathUtils.lerp(0.5, 2.5, t));
            this.camera.position.set(Math.sin(this.time * 0.2) * 10, Math.cos(this.time * 0.2) * 5, 10);
            this.camera.lookAt(this.hero.position);
            this.material.uniforms.uColor.value.setHSL(0.6, 0.8, t * 0.1);
        } else if (this.time < 12) {
            // 5-12s: Power Up - Faster spin, intense colors, camera orbits
            const t = (this.time - 5) / 7;
            this.hero.scale.setScalar(2.5 + Math.sin(this.time * 3) * 0.2);
            const camDist = THREE.MathUtils.lerp(10, 20, t);
            this.camera.position.set(Math.sin(this.time * 0.8) * camDist, Math.sin(this.time * 0.5) * 5, Math.cos(this.time * 0.8) * camDist);
            this.camera.lookAt(this.hero.position);
            this.material.uniforms.uRimColor.value.setHSL(0.5 + t * 0.4, 1.0, 0.6);
        } else if (this.time < 16) {
            // 12-16s: Destabilization - Camera pulls back, Hero vibrates violently
            const t = (this.time - 12) / 4;
            this.camera.position.lerp(new THREE.Vector3(0, 30, 40), t * 0.05);
            this.camera.lookAt(0, 0, 0);
            // Hero vibrates instead of shrinking
            this.hero.scale.setScalar(3.0 + Math.random() * 0.5);
            this.hero.rotation.y += dt * 10;
            this.material.uniforms.uColor.value.setHex(0xffffff); // Flash white before explosion
        } else if (this.time < 20) {
            // 16-20s: Title Fade In
            if (!this.exploded) this.explode();
            this.ui.showTitle(true);
            // Gentle float for menu background
            this.camera.position.x = Math.sin(this.time * 0.2) * 40;
            this.camera.position.z = Math.cos(this.time * 0.2) * 40;
            this.camera.lookAt(0, 0, 0);
        } else {
            this.end();
        }
    }

    explode() {
        this.exploded = true;
        this.hero.visible = false;
        if (this.onExplode) this.onExplode(this.hero.position);
    }

    end() {
        if (!this.exploded) this.explode();
        this.ui.showTitle(true);
        this.active = false;
        this.hero.visible = false;
        this.ui.setCinematicMode(false);
        this.onComplete();
    }
}
