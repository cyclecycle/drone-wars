import * as THREE from 'three';
import { Unit } from './Unit';

export class Projectile {
    public mesh: THREE.Mesh;
    public active: boolean = true;

    private target: Unit;
    private speed: number;
    private damage: number;
    private onHitCallback: (target: Unit, damage: number) => void;

    constructor(
        position: THREE.Vector3,
        target: Unit,
        speed: number,
        damage: number,
        onHit: (target: Unit, damage: number) => void
    ) {
        this.target = target;
        this.speed = speed;
        this.damage = damage;
        this.onHitCallback = onHit;

        // Simple projectile mesh
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
    }

    public update(deltaTime: number): boolean {
        if (!this.active) return false;

        // Move towards target position (even if target moves, we track it for now like a homing missile)
        const direction = new THREE.Vector3().subVectors(this.target.mesh.position, this.mesh.position);
        const distance = direction.length();

        if (distance < 0.5) {
            // Hit
            this.active = false;
            this.onHitCallback(this.target, this.damage);
            return false;
        }

        direction.normalize();
        this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));
        return true;
    }
}
