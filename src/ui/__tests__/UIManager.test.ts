// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../UIManager';
import { Unit, Faction } from '../../core/Unit';
import { Building } from '../../core/Building';
import * as THREE from 'three';

describe('UIManager', () => {
    let uiManager: UIManager;
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'ui-layer';
        document.body.appendChild(container);
        uiManager = new UIManager();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should initialize UI', () => {
        expect(container.children.length).toBeGreaterThan(0);
    });

    it('should update selection panel', () => {
        const mesh = new THREE.Mesh();
        const unit = new Unit(1, mesh, Faction.Enforcers, 'Test Unit');

        uiManager.updateSelection([unit]);

        const panel = container.children[1] as HTMLElement;
        expect(panel.innerHTML).toContain('Test Unit');
        expect(panel.innerHTML).toContain('Health: 100 / 100');
    });

    it('should update selection panel for building', () => {
        const mesh = new THREE.Mesh();
        const building = new Building(1, mesh, Faction.Enforcers, 'Factory');

        uiManager.updateSelection([building]);

        const panel = container.children[1] as HTMLElement;
        expect(panel.innerHTML).toContain('Factory');
        expect(panel.innerHTML).toContain('Queue: 0');
    });

    it('should handle multi-selection', () => {
        const units = [
            new Unit(1, new THREE.Mesh(), Faction.Enforcers, 'U1'),
            new Unit(2, new THREE.Mesh(), Faction.Enforcers, 'U2')
        ];

        uiManager.updateSelection(units);

        const panel = container.children[1] as HTMLElement;
        expect(panel.innerHTML).toContain('Multi-Selection');
        expect(panel.innerHTML).toContain('Count: 2');
    });
});
