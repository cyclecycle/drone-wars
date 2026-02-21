import * as THREE from 'three';
import { Building } from '../core/Building';
import { Faction } from '../core/Unit';

export class CommandCore extends Building {
    private lightMesh: THREE.Mesh;
    private pulseTime: number = 0;

    constructor(id: number, position: THREE.Vector3, faction: Faction) {
        // 3D Proxy Approach: Chunky Geometry
        const group = new THREE.Group();

        let color = 0xffffff;
        let texturePath = '/assets/img/textures/metal-plate.jpg';
        let emissiveColor = 0xff0000;

        if (faction === Faction.Enforcers) {
            color = 0x88aacc;
            emissiveColor = 0xff0000; // Red
        }
        if (faction === Faction.Civilians) {
            color = 0xcccccc; // Light Grey to prevent full-body bloom
            texturePath = '/assets/img/textures/plastic-1.jpg';
            emissiveColor = 0x00ffff; // Cyan
        }
        if (faction === Faction.Terraformers) {
            color = 0xffaa00;
            emissiveColor = 0xffaa00; // Orange
            texturePath = '/assets/img/textures/hazard-plate-1.jpg';
        }

        // Load Texture
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(texturePath);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const material = new THREE.MeshStandardMaterial({
            color: color,
            map: texture,
            roughness: faction === Faction.Civilians ? 0.1 : 0.4,
            metalness: faction === Faction.Civilians ? 0.1 : 0.8
        });

        // Main Block
        const baseGeo = new THREE.BoxGeometry(4, 2, 4);
        const baseMesh = new THREE.Mesh(baseGeo, material);
        baseMesh.position.y = 1;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        group.add(baseMesh);

        // Tower Block
        const towerGeo = new THREE.BoxGeometry(2, 4, 2);
        const towerMesh = new THREE.Mesh(towerGeo, material);
        towerMesh.position.y = 3;
        towerMesh.castShadow = true;
        towerMesh.receiveShadow = true;
        group.add(towerMesh);

        // Emissive Lights (Vents/Strip)
        const lightGeo = new THREE.BoxGeometry(2.2, 0.2, 2.2); // Subtle band
        const lightMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: emissiveColor,
            emissiveIntensity: 1 // Moderate intensity
        });
        const lightMesh = new THREE.Mesh(lightGeo, lightMat);
        lightMesh.position.y = 4;
        group.add(lightMesh);

        // Set position of the whole group
        group.position.copy(position);

        // Ensure user data is set for interaction
        group.userData = { selectable: true };

        super(id, group, faction, 'Command Core');

        this.lightMesh = lightMesh;

        this.isDropoff = true;
        this.health = 2000;
        this.maxHealth = 2000;
    }

    public update(deltaTime: number): string | null {
        // Animation Logic
        // No pulse, just static glow
        // this.pulseTime += deltaTime * 2.0;

        // Pulse Light
        // if (this.lightMesh.material instanceof THREE.MeshStandardMaterial) {
        //     const intensity = 3.0 + Math.sin(this.pulseTime) * 1.0;
        //     this.lightMesh.material.emissiveIntensity = intensity;
        // }

        return super.update(deltaTime);
    }
}
