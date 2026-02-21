import * as THREE from 'three';
import { Faction } from './Unit';

export class Building {
    public mesh: THREE.Object3D;
    public id: number;
    public faction: Faction;
    public name: string = 'Building';
    public health: number = 500;
    public maxHealth: number = 500;
    public isDropoff: boolean = false;
    public productionQueue: string[] = []; // Unit types
    public currentProduction: string | null = null;
    public productionProgress: number = 0;
    public productionDuration: number = 5.0; // Seconds per unit

    constructor(id: number, mesh: THREE.Object3D, faction: Faction, name: string = 'Building') {
        this.id = id;
        this.mesh = mesh;
        this.faction = faction;
        this.name = name;
        this.mesh.userData.building = this; // Link mesh back to Building
    }

    public update(deltaTime: number): string | null {
        if (this.currentProduction) {
            this.productionProgress += deltaTime;
            if (this.productionProgress >= this.productionDuration) {
                const produced = this.currentProduction;
                this.currentProduction = null;
                this.productionProgress = 0;

                // Check queue
                if (this.productionQueue.length > 0) {
                    this.currentProduction = this.productionQueue.shift()!;
                }

                return produced;
            }
        } else if (this.productionQueue.length > 0) {
            this.currentProduction = this.productionQueue.shift()!;
        }
        return null;
    }

    public queueUnit(unitType: string) {
        this.productionQueue.push(unitType);
    }
}
