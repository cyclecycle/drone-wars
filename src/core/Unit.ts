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

    // Physics
    protected velocity: THREE.Vector3 = new THREE.Vector3();
    protected acceleration: THREE.Vector3 = new THREE.Vector3();
    protected maxForce: number = 20.0;

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

    public update(deltaTime: number, units: Unit[] = []) {
        if (this.isWorker) {
            this.handleWorkerLogic(deltaTime);
        }

        this.acceleration.set(0, 0, 0);

        // 1. Path Following (Seek)
        if (this.path.length > 0) {
            const target = this.path[this.currentTargetIndex];
            // Flatten target y
            target.y = this.mesh.position.y;
            
            const dist = this.mesh.position.distanceTo(target);

            // Waypoint switching
            if (dist < 1.0) { 
                this.currentTargetIndex++;
                if (this.currentTargetIndex >= this.path.length) {
                    this.path = []; // Arrived
                    this.velocity.set(0, 0, 0);
                }
            }

            if (this.path.length > 0) {
                // Seek
                const desired = new THREE.Vector3().subVectors(target, this.mesh.position);
                desired.y = 0;
                desired.normalize().multiplyScalar(this.moveSpeed * this.speedMultiplier);
                
                const steer = new THREE.Vector3().subVectors(desired, this.velocity);
                steer.clampLength(0, this.maxForce);
                this.acceleration.add(steer.multiplyScalar(2.0));
            }
        } else {
            // Friction
            const friction = this.velocity.clone().multiplyScalar(-5.0);
            this.acceleration.add(friction);
        }

        // 2. Separation
        if (units.length > 0) {
            const separation = new THREE.Vector3();
            let count = 0;
            const separationRadius = 3.5; 

            for (const other of units) {
                if (other === this) continue;
                const dist = this.mesh.position.distanceTo(other.mesh.position);
                if (dist < separationRadius) {
                    const push = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
                    push.y = 0;
                    push.normalize().divideScalar(dist);
                    separation.add(push);
                    count++;
                }
            }

            if (count > 0) {
                separation.divideScalar(count).normalize().multiplyScalar(this.moveSpeed * this.speedMultiplier);
                const steer = new THREE.Vector3().subVectors(separation, this.velocity);
                steer.clampLength(0, this.maxForce);
                this.acceleration.add(steer.multiplyScalar(4.0)); // Strong separation
            }
        }

        // Integration
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        const maxS = this.moveSpeed * this.speedMultiplier;
        if (this.velocity.length() > maxS) {
            this.velocity.normalize().multiplyScalar(maxS);
        }

        const move = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(move);

        // Rotation
        if (this.velocity.lengthSq() > 0.5) {
            const targetRotation = new THREE.Quaternion();
            const dummy = new THREE.Object3D();
            dummy.position.copy(this.mesh.position);
            // Look at point ahead
            const lookAtPoint = this.mesh.position.clone().add(this.velocity);
            lookAtPoint.y = this.mesh.position.y; // Lock Y
            dummy.lookAt(lookAtPoint);
            targetRotation.copy(dummy.quaternion);
            
            this.mesh.quaternion.slerp(targetRotation, this.turnSpeed * deltaTime);
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
