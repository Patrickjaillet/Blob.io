import * as THREE from 'three';

export class InputSystem {
    constructor(camera, scene) {
        this.camera = camera;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.intersectPoint = new THREE.Vector3();
        
        this.keys = { space: false, e: false };
        this.callbacks = { onBoost: null, onMine: null };

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('keydown', (e) => {
            if(e.code === 'Space') {
                e.preventDefault();
                if(this.callbacks.onBoost) this.callbacks.onBoost();
            }
            if(e.code === 'KeyE') {
                if(this.callbacks.onMine) this.callbacks.onMine();
            }
        });
    }

    getTargetPosition(playerPos) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hit = this.raycaster.ray.intersectPlane(this.plane, this.intersectPoint);
        if(hit) {
            const target = new THREE.Vector3().copy(this.intersectPoint).sub(playerPos);
            target.y = 0;
            target.normalize();
            return target;
        }
        return new THREE.Vector3(0, 0, 1);
    }
}
