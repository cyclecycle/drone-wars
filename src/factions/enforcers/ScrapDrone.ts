import * as THREE from 'three';
import { Unit, Faction } from '../../core/Unit';

export class ScrapDrone extends Unit {
    constructor(id: number, position: THREE.Vector3) {
        // Composite Geometry
        const group = new THREE.Group();

        // Load Texture
        const textureLoader = new THREE.TextureLoader();
        const metalTexture = textureLoader.load('/assets/img/textures/metal-plate.jpg');

        const material = new THREE.MeshStandardMaterial({
            color: 0x888888, // Darker to prevent full body bloom
            map: metalTexture,
            roughness: 0.7,
            metalness: 0.5
        });

        // Chassis
        const chassisGeo = new THREE.BoxGeometry(1.2, 0.8, 1.5);
        const chassis = new THREE.Mesh(chassisGeo, material);
        chassis.position.y = 0.6;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        group.add(chassis);

        // Treads (Black)
        const treadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const treadGeo = new THREE.BoxGeometry(0.4, 0.6, 1.4);

        const leftTread = new THREE.Mesh(treadGeo, treadMat);
        leftTread.position.set(-0.7, 0.3, 0);
        leftTread.castShadow = true;
        group.add(leftTread);

        const rightTread = new THREE.Mesh(treadGeo, treadMat);
        rightTread.position.set(0.7, 0.3, 0);
        rightTread.castShadow = true;
        group.add(rightTread);

        // Tool (Laser Cutter)
        const toolGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8);
        toolGeo.rotateX(Math.PI / 2);
        const tool = new THREE.Mesh(toolGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
        tool.position.set(0, 0.6, 0.8); // Front
        group.add(tool);

        // Emissive Eye
        const eyeGeo = new THREE.BoxGeometry(0.8, 0.2, 0.1);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff0000, emissiveIntensity: 2 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.7, 0.76); // Front of chassis
        group.add(eye);

        group.position.copy(position);
        // Wrapper for selection
        group.userData = { selectable: true };

        super(id, group, Faction.Enforcers, 'Scrap Drone');

        this.moveSpeed = 8;
        this.turnSpeed = 10.0;
        this.health = 50;
        this.maxHealth = 50;
        this.isWorker = true;
        this.carryCapacity = 10;
        this.gatherSpeed = 2; // 2 per second
    }
}
