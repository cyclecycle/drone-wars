import * as THREE from 'three';
import { Unit, Faction } from '../../core/Unit';

export class SecurityDrone extends Unit {
    private shieldRegenRate: number = 5;
    private shieldMesh: THREE.Mesh;

    constructor(id: number, position: THREE.Vector3) {
        const group = new THREE.Group();

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('/assets/img/textures/plastic-1.jpg');

        const material = new THREE.MeshStandardMaterial({
            color: 0xdddddd, // Light Grey
            map: texture,
            roughness: 0.1,
            metalness: 0.1
        });

        // Sphere Body
        const geometry = new THREE.DodecahedronGeometry(0.8);
        const body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        group.add(body);

        // Eye (Glows)
        const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0, 0.6);
        group.add(eye);

        group.position.copy(position);
        group.position.y += 1.5; // Float
        group.userData = { selectable: true };

        super(id, group, Faction.Civilians, 'Security Drone');

        this.moveSpeed = 16;
        this.turnSpeed = 15.0;
        this.health = 80;
        this.maxHealth = 80;
        this.shield = 40;
        this.maxShield = 40;
        this.attackRange = 10;
        this.attackDamage = 8;
        this.attackCooldown = 0.5;

        // Shield Visual
        const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.mesh.add(this.shieldMesh);
    }

    public update(deltaTime: number) {
        super.update(deltaTime);

        if (this.isInGrid) {
            // Regenerate shield
            if (this.shield < this.maxShield) {
                this.shield += this.shieldRegenRate * deltaTime;
                if (this.shield > this.maxShield) this.shield = this.maxShield;
            }
            this.moveSpeed = 16;
            this.shieldMesh.visible = this.shield > 0;
        } else {
            // Lose shield
            if (this.shield > 0) {
                this.shield -= this.shieldRegenRate * deltaTime;
                if (this.shield < 0) this.shield = 0;
            }
            this.moveSpeed = 16 * 0.7;
            this.shieldMesh.visible = this.shield > 0;
        }

        // Bobbing animation
        this.mesh.position.y = 1.5 + Math.sin(Date.now() * 0.003) * 0.2;
    }
}
