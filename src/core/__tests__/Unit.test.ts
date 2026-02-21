import { describe, it, expect } from 'vitest';
import { Unit, Faction } from '../Unit';
import * as THREE from 'three';

describe('Unit', () => {
    it('should move towards target', () => {
        const mesh = new THREE.Mesh();
        const unit = new Unit(1, mesh, Faction.Enforcers);

        // Mock path
        const path = [new THREE.Vector3(10, 0, 0)];
        unit.setPath(path);

        // Update for 1 second. Speed is 5.
        // Should move 5 units towards (10,0,0) -> (5,0,0)
        unit.update(1.0);

        expect(mesh.position.x).toBeCloseTo(5);
        expect(mesh.position.y).toBe(0);
        expect(mesh.position.z).toBe(0);
    });

    it('should stop at destination', () => {
        const mesh = new THREE.Mesh();
        const unit = new Unit(1, mesh, Faction.Enforcers);

        const path = [new THREE.Vector3(5, 0, 0)];
        unit.setPath(path);

        // Update for 2 seconds. Distance is 5. Speed is 5.
        // Should reach destination in 1s.
        unit.update(2.0);

        expect(mesh.position.x).toBeCloseTo(5);

        // Update again, should not move further
        unit.update(1.0);
        expect(mesh.position.x).toBeCloseTo(5);
    });
});
