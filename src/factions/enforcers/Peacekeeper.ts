import * as THREE from 'three';
import { Unit, Faction } from '../../core/Unit';

export class Peacekeeper extends Unit {
    constructor(id: number, position: THREE.Vector3) {
        const group = new THREE.Group();

        // Texture
        const textureLoader = new THREE.TextureLoader();
        const metalTexture = textureLoader.load('/assets/img/textures/metal-plate.jpg');

        const material = new THREE.MeshStandardMaterial({
            color: 0x446688, // Dark Blue-Grey
            map: metalTexture,
            roughness: 0.6,
            metalness: 0.6
        });

        // Legs
        const legGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
        const leftLeg = new THREE.Mesh(legGeo, material);
        leftLeg.position.set(-0.6, 0.6, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, material);
        rightLeg.position.set(0.6, 0.6, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);

        // Body
        const bodyGeo = new THREE.BoxGeometry(1.5, 1.2, 1);
        const body = new THREE.Mesh(bodyGeo, material);
        body.position.y = 1.8;
        body.castShadow = true;
        group.add(body);

        // Gun
        const gunGeo = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        const gun = new THREE.Mesh(gunGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        gun.position.set(0.9, 1.8, 0.5);
        group.add(gun);

        // Visor (Glowing)
        const visorGeo = new THREE.BoxGeometry(0.8, 0.2, 0.1);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xff0000,
            emissiveIntensity: 2.0 // Glows
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 2.1, 0.51);
        group.add(visor);

        group.position.copy(position);
        group.userData = { selectable: true };

        super(id, group, Faction.Enforcers, 'Peacekeeper');
        
        this.moveSpeed = 20;
        this.turnSpeed = 10.0;
        this.attackRange = 15;
        this.attackDamage = 10;
        this.attackCooldown = 0.8;
    }
}
