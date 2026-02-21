import * as THREE from 'three';
import { Unit, Faction } from '../../core/Unit';

export class Thumper extends Unit {
    private stompRange: number = 8;
    private stompDamage: number = 20;
    private stompCooldown: number = 3.0;
    private stompTimer: number = 0;

    constructor(id: number, position: THREE.Vector3) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('/assets/img/textures/hazard-plate-1.jpg');

        const geometry = new THREE.BoxGeometry(2.5, 1.5, 2.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            map: texture,
            roughness: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.userData = { selectable: true };

        super(id, mesh, Faction.Terraformers, 'Thumper');

        this.moveSpeed = 7;
        this.turnSpeed = 6.0;
        this.health = 250;
        this.maxHealth = 250;
    }

    public update(deltaTime: number) {
        super.update(deltaTime);
        this.stompTimer += deltaTime;
    }

    public canStomp(): boolean {
        return this.stompTimer >= this.stompCooldown;
    }

    public stomp(enemies: Unit[]) {
        if (!this.canStomp()) return;

        this.stompTimer = 0;

        this.createShockwave();

        enemies.forEach(enemy => {
            const dist = this.mesh.position.distanceTo(enemy.mesh.position);
            if (dist <= this.stompRange) {
                // Apply damage
                enemy.health -= this.stompDamage;

                // Apply slow
                enemy.speedMultiplier = 0.5;

                // Simple timeout to reset speed
                setTimeout(() => {
                    if (enemy) enemy.speedMultiplier = 1.0;
                }, 2000);

                console.log(`${this.name} stomped ${enemy.name}! Health: ${enemy.health}`);
            }
        });
    }

    private createShockwave() {
        if (!this.mesh.parent) return;

        const geometry = new THREE.RingGeometry(0.5, 1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(this.mesh.position);
        mesh.position.y = 0.2; // Slightly above ground
        this.mesh.parent.add(mesh);

        const startTime = performance.now();
        const duration = 500; // ms

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                if (mesh.parent) mesh.parent.remove(mesh);
                return;
            }

            const scale = 1 + progress * this.stompRange;
            mesh.scale.set(scale, scale, 1);
            material.opacity = 0.5 * (1 - progress);

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}
