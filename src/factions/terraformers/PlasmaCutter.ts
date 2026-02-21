import * as THREE from 'three';
import { Unit, Faction } from '../../core/Unit';

export class PlasmaCutter extends Unit {
    private beamMesh: THREE.Mesh;
    private beamTarget: Unit | null = null;
    private attackDuration: number = 0;

    // Stats
    private baseDamage: number = 25; // Continuous damage per second
    private maxDamageMultiplier: number = 3.0;
    private rampUpTime: number = 3.0;

    constructor(id: number, position: THREE.Vector3) {
        // Main body
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('/assets/img/textures/hazard-plate-1.jpg');

        const geometry = new THREE.CylinderGeometry(0.5, 0.8, 2, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xcc6600, // Darker orange
            map: texture,
            roughness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.userData = { selectable: true };

        super(id, mesh, Faction.Terraformers, 'Plasma Cutter');

        this.moveSpeed = 18;
        this.turnSpeed = 8.0;
        this.health = 150;
        this.maxHealth = 150;
        this.attackRange = 5;
        this.attackDamage = this.baseDamage;
        this.attackCooldown = 0.1;

        // Beam visual
        // Cylinder is Y-up. Rotate 90 deg X to be Z-forward.
        const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        beamGeo.rotateX(Math.PI / 2);
        // Translate so start is at origin
        beamGeo.translate(0, 0, 0.5);

        const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
        this.beamMesh.visible = false;

        this.mesh.add(this.beamMesh);
    }

    public attack(target: Unit) {
        if (this.beamTarget !== target) {
            this.attackDuration = 0;
            this.beamTarget = target;
        }
    }

    public stopAttack() {
        this.beamTarget = null;
        this.attackDuration = 0;
        this.beamMesh.visible = false;
    }

    public update(deltaTime: number, units: Unit[] = []) {
        super.update(deltaTime, units);

        if (this.beamTarget) {
            const dist = this.mesh.position.distanceTo(this.beamTarget.mesh.position);

            // Range check
            if (dist > this.attackRange + 1 || this.beamTarget.health <= 0) {
                this.stopAttack();
                return;
            }

            // Ramp up damage
            this.attackDuration += deltaTime;
            const rampFactor = Math.min(this.attackDuration / this.rampUpTime, 1.0);
            const currentMultiplier = 1.0 + (this.maxDamageMultiplier - 1.0) * rampFactor;

            // Deal damage
            const damageTick = this.baseDamage * currentMultiplier * deltaTime;
            this.beamTarget.health -= damageTick;

            // Visuals
            this.beamMesh.visible = true;

            // Rotate unit to face target
            this.mesh.lookAt(this.beamTarget.mesh.position);

            // Scale beam length (Z-scale)
            this.beamMesh.scale.set(1, 1, dist);

            // Color feedback for ramp
            const mat = this.beamMesh.material as THREE.MeshBasicMaterial;
            // Ramp from Yellow to Red
            mat.color.setHSL(0.1 - (rampFactor * 0.1), 1.0, 0.5);

            if (this.beamTarget.health <= 0) {
                this.stopAttack();
            }
        } else {
            this.beamMesh.visible = false;
        }
    }
}
