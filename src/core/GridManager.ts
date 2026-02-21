import * as THREE from 'three';
import { Unit } from './Unit';

export interface GridSource {
    position: THREE.Vector3;
    radius: number;
    active: boolean;
}

export class GridManager {
    private sources: GridSource[] = [];
    private scene: THREE.Scene;
    private debugMesh: THREE.Group;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.debugMesh = new THREE.Group();
        this.scene.add(this.debugMesh);
    }

    public addSource(source: GridSource) {
        this.sources.push(source);
        this.updateDebugVisuals();
    }

    public removeSource(source: GridSource) {
        this.sources = this.sources.filter(s => s !== source);
        this.updateDebugVisuals();
    }

    public update(_deltaTime: number, units: Unit[]) {
        units.forEach(unit => {
            unit.isInGrid = this.isInsideGrid(unit.mesh.position);
        });
    }

    public isInsideGrid(position: THREE.Vector3): boolean {
        for (const source of this.sources) {
            if (!source.active) continue;
            const distance = position.distanceTo(source.position);
            if (distance <= source.radius) {
                return true;
            }
        }
        return false;
    }

    private updateDebugVisuals() {
        // Clear old visuals
        while (this.debugMesh.children.length > 0) {
            this.debugMesh.remove(this.debugMesh.children[0]);
        }

        // Procedural Grid Texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw a circle or hex pattern? Let's do concentric circles + crosshair
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.moveTo(64, 0); ctx.lineTo(64, 128);
        ctx.moveTo(0, 64); ctx.lineTo(128, 64);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // Add visual for each source
        const geometry = new THREE.RingGeometry(0, 1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cyan
            map: texture,
            transparent: true,
            opacity: 0.2, // Subtle
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending // Glowy effect
        });

        this.sources.forEach(source => {
            if (!source.active) return;
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(source.position);
            mesh.position.y = 0.1; // Slightly above ground
            mesh.rotation.x = -Math.PI / 2;
            mesh.scale.set(source.radius, source.radius, 1);
            this.debugMesh.add(mesh);
        });
    }
}
