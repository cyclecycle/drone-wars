import * as THREE from 'three';

export enum ResourceType {
    Metal = 'Metal',
    Energy = 'Energy'
}

export class ResourceNode {
    public mesh: THREE.Mesh;
    public type: ResourceType;
    public amount: number;
    public maxAmount: number;
    public id: number;

    constructor(id: number, position: THREE.Vector3, type: ResourceType, amount: number) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.maxAmount = amount;

        let geometry: THREE.BufferGeometry;
        let color: number;

        if (type === ResourceType.Metal) {
            geometry = new THREE.DodecahedronGeometry(1.5); // Geode shape
            color = 0xaaaaaa; // Grey/Silver
        } else {
            geometry = new THREE.OctahedronGeometry(1.5); // Crystal shape
            color = 0x00ffff; // Cyan/Energy
        }

        const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.8 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Link mesh back to ResourceNode for raycasting
        this.mesh.userData = { resourceNode: this, selectable: true };
    }

    public harvest(amount: number): number {
        const harvested = Math.min(this.amount, amount);
        this.amount -= harvested;

        // Visual feedback (shrink slightly as depleted)
        const scale = 0.2 + 0.8 * (this.amount / this.maxAmount);
        this.mesh.scale.setScalar(scale);

        if (this.amount <= 0) {
            this.mesh.visible = false;
        }

        return harvested;
    }
}
