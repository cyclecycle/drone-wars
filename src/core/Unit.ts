import * as THREE from 'three';

import { ResourceType, ResourceNode } from './ResourceNode';
import { Building } from './Building';

export enum Faction {
    Enforcers = 'Enforcers',
    Civilians = 'Civilians',
    Terraformers = 'Terraformers'
}

export class Unit {
    public mesh: THREE.Object3D;
    public id: number;
    public isSelected: boolean = false;
    public faction: Faction;

    // Stats
    public name: string = 'Unit';
    public health: number = 100;
    public maxHealth: number = 100;
    public shield: number = 0;
    public maxShield: number = 0;
    public isInGrid: boolean = false;

    public attackRange: number = 0;
    public attackDamage: number = 0;
    public attackCooldown: number = 1.0;
    public lastAttackTime: number = 0;

    // Worker Stats
    public isWorker: boolean = false;
    public carryCapacity: number = 0;
    public currentLoad: number = 0;
    public carriedResourceType: ResourceType | null = null;
    public gatherSpeed: number = 5; // Resources per second
    public gatherRange: number = 2;
    public dropoffRange: number = 3;

    public gatherTarget: ResourceNode | null = null;
    public dropoffTarget: Building | null = null;
    public isGathering: boolean = false;
    public isDroppingOff: boolean = false;

    public findPathCallback: ((start: THREE.Vector3, end: THREE.Vector3) => THREE.Vector3[]) | null = null;
    public onDropoffCallback: ((amount: number, type: ResourceType) => void) | null = null;

    protected path: THREE.Vector3[] = [];
    public moveSpeed: number = 5;
    public speedMultiplier: number = 1.0;
    protected currentTargetIndex: number = 0;

    public turnSpeed: number = 5.0; // Radians per second

    protected selectionRing: THREE.Mesh;

    constructor(id: number, mesh: THREE.Object3D, faction: Faction, name: string = 'Unit') {
        this.id = id;
        this.mesh = mesh;
        this.faction = faction;
        this.name = name;
        this.mesh.userData.unit = this; // Link mesh back to Unit

        // Create Selection Ring
        const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
        this.selectionRing.rotation.x = -Math.PI / 2; // Flat on ground
        this.selectionRing.position.y = 0.1;
        this.selectionRing.visible = false;

        // Add to scene or mesh?
        // If added to mesh, it rotates with unit. Usually selection rings don't rotate.
        // But for simplicity, let's add to mesh for now.
        // Actually, rotating selection ring is fine for units.
        this.mesh.add(this.selectionRing);

        // Minimap Icon (Layer 1)
        const iconGeo = new THREE.CircleGeometry(8, 16);
        let iconColor = 0xffffff;
        if (faction === Faction.Enforcers) iconColor = 0xff0000;
        if (faction === Faction.Civilians) iconColor = 0x00ffff;
        if (faction === Faction.Terraformers) iconColor = 0xffaa00;

        const iconMat = new THREE.MeshBasicMaterial({ color: iconColor, side: THREE.DoubleSide });
        const icon = new THREE.Mesh(iconGeo, iconMat);
        icon.rotation.x = -Math.PI / 2;
        icon.position.y = 10;
        icon.layers.set(1);
        this.mesh.add(icon);
    }

    public setPath(path: THREE.Vector3[]) {
        this.path = path;
        this.currentTargetIndex = 0;

        // Visualize path (optional debug)
        // console.log(`Unit ${this.id} path set:`, path);
    }

    public update(deltaTime: number) {
        if (this.isWorker) {
            this.handleWorkerLogic(deltaTime);
        }

        if (this.path.length === 0) {
            // Idle logic or finished path
        } else {
            const target = this.path[this.currentTargetIndex];
            const position = this.mesh.position;

            // Calculate direction to target
            const direction = new THREE.Vector3().subVectors(target, position);
            direction.y = 0; // Keep movement flat
            const distance = direction.length();

            if (distance < 0.1) {
                // Reached node
                this.currentTargetIndex++;
                if (this.currentTargetIndex >= this.path.length) {
                    this.path = []; // Reached destination
                }
            } else {
                // Move towards target
                direction.normalize();
                const step = this.moveSpeed * this.speedMultiplier * deltaTime;

                if (step >= distance) {
                    // Snap to target if we would overshoot
                    position.copy(target);
                    // Also advance to next node immediately so we don't get stuck for a frame
                    this.currentTargetIndex++;
                    if (this.currentTargetIndex >= this.path.length) {
                        this.path = [];
                    }
                } else {
                    position.add(direction.multiplyScalar(step));
                }

                // Rotate to face direction (Y-axis only)
                const lookTarget = target.clone();
                lookTarget.y = this.mesh.position.y;

                const targetRotation = new THREE.Quaternion();
                const dummy = new THREE.Object3D();
                dummy.position.copy(this.mesh.position);
                dummy.lookAt(lookTarget);
                targetRotation.copy(dummy.quaternion);

                this.mesh.quaternion.slerp(targetRotation, this.turnSpeed * deltaTime);
            }
        }
    }

    private handleWorkerLogic(deltaTime: number) {
        if (this.isGathering) {
            if (this.currentLoad >= this.carryCapacity) {
                this.isGathering = false;
                this.returnToDropoff();
                return;
            }

            if (!this.gatherTarget || this.gatherTarget.amount <= 0) {
                this.isGathering = false;
                this.gatherTarget = null;
                return; // Stop if depleted
            }

            const dist = this.mesh.position.distanceTo(this.gatherTarget.mesh.position);
            if (dist <= this.gatherRange) {
                // Harvest
                const amount = Math.min(this.gatherSpeed * deltaTime, this.carryCapacity - this.currentLoad);
                const gathered = this.gatherTarget.harvest(amount);
                this.currentLoad += gathered;
                this.carriedResourceType = this.gatherTarget.type;
            } else if (this.path.length === 0 && this.findPathCallback) {
                // Move to resource
                const path = this.findPathCallback(this.mesh.position, this.gatherTarget.mesh.position);
                if (path.length > 0) this.setPath(path);
            }
        } else if (this.isDroppingOff) {
            if (this.currentLoad <= 0) {
                this.isDroppingOff = false;
                this.returnToResource();
                return;
            }

            if (!this.dropoffTarget) {
                this.isDroppingOff = false; // No dropoff
                return;
            }

            const dist = this.mesh.position.distanceTo(this.dropoffTarget.mesh.position);
            if (dist <= this.dropoffRange) {
                // Deposit
                if (this.onDropoffCallback && this.carriedResourceType) {
                    this.onDropoffCallback(this.currentLoad, this.carriedResourceType);
                    this.currentLoad = 0;
                    this.carriedResourceType = null;
                }
            } else if (this.path.length === 0 && this.findPathCallback) {
                // Move to dropoff
                const path = this.findPathCallback(this.mesh.position, this.dropoffTarget.mesh.position);
                if (path.length > 0) this.setPath(path);
            }
        }
    }

    public startGathering(resource: ResourceNode, dropoff: Building) {
        this.gatherTarget = resource;
        this.dropoffTarget = dropoff;
        this.isGathering = true;
        this.isDroppingOff = false;
        this.path = []; // Stop current movement to recalculate
    }

    private returnToDropoff() {
        this.isDroppingOff = true;
        this.path = [];
    }

    private returnToResource() {
        this.isGathering = true;
        this.path = [];
    }

    public setSelected(selected: boolean) {
        this.isSelected = selected;
        this.selectionRing.visible = selected;
    }
}
