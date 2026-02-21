import * as THREE from 'three';
import { Building } from './Building';
import { Faction } from './Unit';
import { PathfindingManager } from './PathfindingManager';
import { ResourceManager } from './ResourceManager';

export class BuildingManager {
    private scene: THREE.Scene;
    private pathfindingManager: PathfindingManager;
    private resourceManager: ResourceManager;
    private buildings: Building[] = [];
    private previewMesh: THREE.Mesh | null = null;

    constructor(scene: THREE.Scene, pathfindingManager: PathfindingManager, resourceManager: ResourceManager) {
        this.scene = scene;
        this.pathfindingManager = pathfindingManager;
        this.resourceManager = resourceManager;
    }

    public startPlacement(_buildingType: string) {
        // Create preview mesh
        const geometry = new THREE.BoxGeometry(4, 3, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5 });
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.previewMesh);
    }

    public updatePreview(position: THREE.Vector3) {
        if (!this.previewMesh) return;

        // Snap to grid (assuming 1 unit grid, building size 4x4)
        // Center on even coordinates if size is even
        const x = Math.round(position.x);
        const z = Math.round(position.z);

        this.previewMesh.position.set(x, 1.5, z);

        // Check validity (simple check)
        const isValid = this.isValidPlacement(x, z, 4, 4);
        (this.previewMesh.material as THREE.MeshBasicMaterial).color.setHex(isValid ? 0x00ff00 : 0xff0000);
    }

    public confirmPlacement(position: THREE.Vector3, faction: Faction): Building | null {
        if (!this.previewMesh) return null;

        const x = Math.round(position.x);
        const z = Math.round(position.z);

        if (!this.isValidPlacement(x, z, 4, 4)) {
            console.log("Invalid placement");
            return null;
        }

        // Deduct cost (mock)
        const cost = { metal: 100, energy: 0 };
        if (!this.resourceManager.spend(cost.metal, cost.energy)) {
            console.log("Not enough resources");
            return null;
        }

        // Create building
        // For now, generic building
        const geometry = new THREE.BoxGeometry(4, 3, 4);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, 1.5, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { selectable: true };

        const building = new Building(Date.now(), mesh, faction, 'Assembly Plant');
        this.buildings.push(building);
        this.scene.add(mesh);

        // Block pathfinding
        this.blockPathfinding(x, z, 4, 4);

        this.cancelPlacement();
        return building;
    }

    public cancelPlacement() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh = null;
        }
    }

    private isValidPlacement(x: number, z: number, _width: number, _depth: number): boolean {
        // Check if overlaps with existing buildings or obstacles
        // For now, rely on pathfinding grid?
        // Pathfinding grid stores walkability.
        // We need to check if area is walkable.

        // This requires PathfindingManager to expose isWalkableAt(x, z).
        // Let's assume PathfindingManager handles obstacles and we check if region is clear.
        // But PathfindingManager logic is internal.

        // Mock: Check distance to other buildings
        for (const b of this.buildings) {
            if (Math.abs(b.mesh.position.x - x) < 4 && Math.abs(b.mesh.position.z - z) < 4) {
                return false;
            }
        }
        return true;
    }

    private blockPathfinding(centerX: number, centerZ: number, width: number, depth: number) {
        const halfWidth = width / 2;
        const halfDepth = depth / 2;

        for (let x = centerX - halfWidth; x < centerX + halfWidth; x++) {
            for (let z = centerZ - halfDepth; z < centerZ + halfDepth; z++) {
                this.pathfindingManager.setObstacle(x, z, false);
            }
        }
    }
}
