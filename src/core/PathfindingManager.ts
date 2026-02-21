import PF from 'pathfinding';
import * as THREE from 'three';

export class PathfindingManager {
    private grid: PF.Grid;
    private finder: PF.AStarFinder;
    private mapSize: number;
    private tileSize: number;

    constructor(mapSize: number = 100, tileSize: number = 1) {
        this.mapSize = mapSize;
        this.tileSize = tileSize;
        const gridDimension = Math.ceil(mapSize / tileSize);
        this.grid = new PF.Grid(gridDimension, gridDimension);

        // Allow diagonal movement
        this.finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });
    }

    public setObstacle(x: number, z: number, isWalkable: boolean) {
        // Convert world coords to grid coords
        const gridX = Math.floor((x + this.mapSize / 2) / this.tileSize);
        const gridY = Math.floor((z + this.mapSize / 2) / this.tileSize);

        if (this.grid.isInside(gridX, gridY)) {
            this.grid.setWalkableAt(gridX, gridY, isWalkable);
        }
    }

    public findPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
        // Clone the grid so we don't modify the base grid during search
        const gridBackup = this.grid.clone();

        const startX = Math.floor((start.x + this.mapSize / 2) / this.tileSize);
        const startY = Math.floor((start.z + this.mapSize / 2) / this.tileSize);

        const endX = Math.floor((end.x + this.mapSize / 2) / this.tileSize);
        const endY = Math.floor((end.z + this.mapSize / 2) / this.tileSize);

        if (!gridBackup.isInside(startX, startY) || !gridBackup.isInside(endX, endY)) {
            return [];
        }

        const path = this.finder.findPath(startX, startY, endX, endY, gridBackup);

        // Convert grid coords back to world coords
        return path.map(([x, y]) => {
            return new THREE.Vector3(
                (x * this.tileSize) - this.mapSize / 2 + this.tileSize / 2,
                0, // Assuming flat plane for now
                (y * this.tileSize) - this.mapSize / 2 + this.tileSize / 2
            );
        });
    }
}
