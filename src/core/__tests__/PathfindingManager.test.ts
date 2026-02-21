import { describe, it, expect, beforeEach } from 'vitest';
import { PathfindingManager } from '../PathfindingManager';
import * as THREE from 'three';

describe('PathfindingManager', () => {
    let manager: PathfindingManager;

    beforeEach(() => {
        manager = new PathfindingManager(10, 1); // 10x10 grid, center at (0,0) corresponds to grid(5,5)
    });

    it('should find a straight path', () => {
        const start = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(2, 0, 0);
        const path = manager.findPath(start, end);

        expect(path.length).toBeGreaterThan(0);
        const lastPoint = path[path.length - 1];
        // Grid based pathfinding snaps to tile centers.
        // x=2 maps to grid index 7 (in 10x10 grid with center 0). Tile 7 corresponds to world x [2,3]. Center is 2.5.
        expect(lastPoint.x).toBeCloseTo(2.5);
        // z=0 maps to grid index 5. Tile 5 corresponds to world z [0,1]. Center is 0.5.
        expect(lastPoint.z).toBeCloseTo(0.5);
    });

    it('should avoid obstacles', () => {
        // Place obstacle between start(0,0) and end(2,0) at (1,0)
        manager.setObstacle(1, 0, false);

        const start = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(2, 0, 0);
        const path = manager.findPath(start, end);

        expect(path.length).toBeGreaterThan(0);

        // Ensure none of the path points are at (1,0)
        // Note: Coordinates are centered in tiles, so we check proximity
        const hitObstacle = path.some(p => Math.abs(p.x - 1) < 0.1 && Math.abs(p.z - 0) < 0.1);
        expect(hitObstacle).toBe(false);
    });

    it('should return empty array if start or end is invalid', () => {
        const start = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(100, 0, 0); // Out of bounds (mapSize is 10, so bounds are +/- 5)
        const path = manager.findPath(start, end);

        expect(path.length).toBe(0);
    });
});
