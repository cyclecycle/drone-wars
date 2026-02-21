import * as THREE from 'three';

export class CameraController {
    private camera: THREE.PerspectiveCamera;
    private domElement: HTMLElement;

    private moveSpeed = 100; // Increased pan speed
    private minZoom = 10;
    private maxZoom = 600;
    
    private keys = {
        w: false,
        a: false,
        s: false,
        d: false,
    };

    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;

        this.initEvents();
    }

    private initEvents() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        this.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    private onKeyDown(event: KeyboardEvent) {
        switch (event.key.toLowerCase()) {
            case 'w': this.keys.w = true; break;
            case 'a': this.keys.a = true; break;
            case 's': this.keys.s = true; break;
            case 'd': this.keys.d = true; break;
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        switch (event.key.toLowerCase()) {
            case 'w': this.keys.w = false; break;
            case 'a': this.keys.a = false; break;
            case 's': this.keys.s = false; break;
            case 'd': this.keys.d = false; break;
        }
    }

    private onWheel(event: WheelEvent) {
        event.preventDefault();
        const zoomAmount = event.deltaY * 0.05;
        const newY = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.position.y + zoomAmount));
        this.camera.position.y = newY;
    }

    public update(deltaTime: number) {
        const speed = this.moveSpeed * deltaTime;

        if (this.keys.w) this.camera.position.z -= speed;
        if (this.keys.s) this.camera.position.z += speed;
        if (this.keys.a) this.camera.position.x -= speed;
        if (this.keys.d) this.camera.position.x += speed;
    }
}
