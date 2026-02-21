import * as THREE from 'three';
import { CameraController } from './CameraController';
import { InteractionManager } from './InteractionManager';
import { PathfindingManager } from '../core/PathfindingManager';
import { Unit, Faction } from '../core/Unit';
import { ScrapDrone } from '../factions/enforcers/ScrapDrone';
import { Peacekeeper } from '../factions/enforcers/Peacekeeper';
import { SecurityDrone } from '../factions/civilians/SecurityDrone';
import { PlasmaCutter } from '../factions/terraformers/PlasmaCutter';
import { Thumper } from '../factions/terraformers/Thumper';
import { UIManager } from '../ui/UIManager';
import { Minimap } from '../ui/Minimap';
import { ProjectileManager } from '../core/ProjectileManager';
import { GridManager } from '../core/GridManager';
import { ResourceManager } from '../core/ResourceManager';
import { ResourceNode, ResourceType } from '../core/ResourceNode';
import { Building } from '../core/Building';
import { CommandCore } from '../buildings/CommandCore';
import { BuildingManager } from '../core/BuildingManager';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class SceneManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private container: HTMLElement;
    private cameraController: CameraController;
    private interactionManager: InteractionManager;
    private pathfindingManager: PathfindingManager;
    private uiManager: UIManager;
    private projectileManager: ProjectileManager;
    private gridManager: GridManager;
    private resourceManager: ResourceManager;
    private _buildingManager: BuildingManager;
    private minimap: Minimap;
    private units: Unit[] = [];
    private buildings: Building[] = [];
    private resources: ResourceNode[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333344); // Lighter haze
        this.scene.fog = new THREE.FogExp2(0x333344, 0.002); // Reduced fog density for large map

        this.uiManager = new UIManager();

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000 // Farther frustum
        );
        this.camera.position.set(0, 120, -200); // Look at Enforcer base from south
        this.camera.lookAt(0, 0, -300);
        this.camera.layers.disable(1); // Layer 1 is for Minimap icons only

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.autoClear = false; // Important for overlay
        this.container.appendChild(this.renderer.domElement);

        // Post-Processing Setup
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Resolution, Strength, Radius, Threshold
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,  // Strength: Reduced for subtlety
            0.2,  // Radius
            0.2   // Threshold: Lowered to catch Red light easily
        );
        this.composer.addPass(bloomPass);

        const mapSize = 800;
        this.minimap = new Minimap(this.scene, this.renderer, mapSize, this.camera);
        this.minimap.onNavigate = (target) => {
            // Move camera so it looks at target
            // Current Camera pos relative to lookAt (0,0,0) is (0, 120, -200) - (0,0,0) = (0, 120, -200).
            // Actually initial lookAt was (0,0,-300), pos (0, 120, -200).
            // Offset = (0, 120, 100).

            // Let's just set X/Z of camera to target X/Z + offset
            const offset = new THREE.Vector3(0, 120, 100);
            this.camera.position.copy(target).add(offset);
            // Look target is target
            // We need CameraController to update its internal state if it tracks target?
            // CameraController tracks camera position.
            // But if we just move camera, CameraController might be confused if it has internal state.
            // Let's check CameraController.
        };

        this.pathfindingManager = new PathfindingManager(mapSize, 1);
        this.projectileManager = new ProjectileManager(this.scene);
        this.gridManager = new GridManager(this.scene);
        this.resourceManager = new ResourceManager(100, 50);
        this._buildingManager = new BuildingManager(this.scene, this.pathfindingManager, this.resourceManager);

        // Add a test Grid Source
        this.gridManager.addSource({
            position: new THREE.Vector3(0, 0, 15),
            radius: 20,
            active: true
        });

        this.setupLights(mapSize);
        this.setupMap(mapSize);
        this.setupObstacles();
        this.setupResources();
        this.setupBuildings();
        this.setupUnits();

        this.resourceManager.setCallback((metal, energy) => {
            this.uiManager.updateResources(metal, energy);
        });

        this.cameraController = new CameraController(this.camera, this.renderer.domElement);
        this.interactionManager = new InteractionManager(this.camera, this.renderer.domElement);

        // Setup Interaction
        this.updateSelectables();
        // Pass ground plane to interaction manager (it's the last child added in setupMap)
        // Better to store it properly in setupMap, but for now assuming it's found by name
        const ground = this.scene.getObjectByName('GroundPlane');
        if (ground) {
            this.interactionManager.ground = ground;
        }

        // Handle Unit Selection and Actions
        this.interactionManager.onRightClick = (point: THREE.Vector3, target?: THREE.Object3D) => {
            const selectedUnits = this.interactionManager.selected
                .map(mesh => mesh.userData.unit as Unit)
                .filter(unit => unit !== undefined);

            selectedUnits.forEach(unit => {
                if (target && target.userData.unit) {
                    // Attack command
                    const targetUnit = target.userData.unit as Unit;
                    if (unit.faction !== targetUnit.faction) {
                        if (unit instanceof Peacekeeper) {
                            // Projectile Attack
                            this.projectileManager.createProjectile(
                                unit.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
                                targetUnit,
                                10,
                                unit.attackDamage
                            );
                            console.log(`${unit.name} attacking ${targetUnit.name}`);
                        } else if (unit instanceof PlasmaCutter) {
                            // Beam Attack
                            unit.attack(targetUnit);
                            console.log(`${unit.name} locked on ${targetUnit.name}`);
                        }
                    }
                } else if (target && target.userData.resourceNode) {
                    // Gather command
                    if (unit.isWorker) {
                        const resource = target.userData.resourceNode as ResourceNode;
                        // Find dropoff
                        const dropoff = this.buildings.find(b => b.isDropoff && b.faction === unit.faction);
                        if (dropoff) {
                            unit.startGathering(resource, dropoff);
                        } else {
                            console.log('No dropoff point found for faction: ' + unit.faction);
                        }
                    }
                } else {
                    // Move command
                    const path = this.pathfindingManager.findPath(unit.mesh.position, point);
                    if (path.length > 0) {
                        unit.setPath(path);
                    }
                }
            });
        };

        this.interactionManager.onSelectionChanged = (selected: THREE.Object3D[]) => {
            const selection: (Unit | Building)[] = [];
            selected.forEach(mesh => {
                if (mesh.userData.unit) selection.push(mesh.userData.unit as Unit);
                if (mesh.userData.building) selection.push(mesh.userData.building as Building);
            });
            this.uiManager.updateSelection(selection);
        };

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private setupLights(mapSize: number): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // High visibility
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffeeb1, 2.0); // Intense sun
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 4096; // Higher Res for big map
        directionalLight.shadow.mapSize.height = 4096;
        // Expand shadow frustum to cover map
        const d = mapSize / 2;
        directionalLight.shadow.camera.left = -d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = -d;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);
    }

    private setupMap(size: number): void {
        // const size = 100; // Handled by arg now
        // const divisions = 20;
        // const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
        // this.scene.add(gridHelper); // Remove grid helper, we have real textures now

        const textureLoader = new THREE.TextureLoader();

        // Base Soil
        const soilTexture = textureLoader.load('/assets/img/textures/soil-1.jpg');
        soilTexture.wrapS = THREE.RepeatWrapping;
        soilTexture.wrapT = THREE.RepeatWrapping;
        soilTexture.repeat.set(64, 64); // 8x larger map, 8x more tiling
        soilTexture.rotation = Math.PI / 4; // Rotate to break grid alignment
        soilTexture.colorSpace = THREE.SRGBColorSpace;

        const soilMat = new THREE.MeshStandardMaterial({
            map: soilTexture,
            roughness: 0.9,
            metalness: 0.1,
            color: 0x888888
        });

        const planeGeometry = new THREE.PlaneGeometry(size, size, 64, 64); // More segments for vertex displacement if needed
        const soilPlane = new THREE.Mesh(planeGeometry, soilMat);
        soilPlane.rotation.x = -Math.PI / 2;
        soilPlane.receiveShadow = true;
        soilPlane.name = 'GroundPlane';
        this.scene.add(soilPlane);

        // Grass Layer (Organic Patches)
        const grassTexture = textureLoader.load('/assets/img/textures/grass-1.jpg');
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(128, 128); // Finer texture detail
        grassTexture.colorSpace = THREE.SRGBColorSpace;

        // Procedural Alpha Map (Organic Noise)
        const alphaCanvas = document.createElement('canvas');
        alphaCanvas.width = 512;
        alphaCanvas.height = 512;
        const ctx = alphaCanvas.getContext('2d')!;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 512);

        // Draw organic blobs (Sparser)
        ctx.fillStyle = '#ffffff';
        ctx.filter = 'blur(30px)'; // Softer edges
        for (let i = 0; i < 15; i++) { // Fewer patches (was 30)
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 20 + Math.random() * 60; // Smaller patches
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const alphaMap = new THREE.CanvasTexture(alphaCanvas);

        const grassMat = new THREE.MeshStandardMaterial({
            map: grassTexture,
            alphaMap: alphaMap,
            transparent: true,
            roughness: 1.0,
            metalness: 0.0,
            color: 0x88aa88,
            polygonOffset: true,
            polygonOffsetFactor: -1
        });

        const grassPlane = new THREE.Mesh(planeGeometry, grassMat);
        grassPlane.rotation.x = -Math.PI / 2;
        grassPlane.receiveShadow = false; // Disable shadows to flatten the look
        this.scene.add(grassPlane);
    }

    private setupObstacles(): void {
        const geometry = new THREE.BoxGeometry(4, 4, 4);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888 });

        const obstacles = [
            { x: 15, z: 15 },
            { x: -15, z: -15 },
            { x: 15, z: -15 },
            { x: -15, z: 15 }
        ];

        obstacles.forEach(pos => {
            const obs = new THREE.Mesh(geometry, material);
            obs.position.set(pos.x, 2, pos.z);
            obs.castShadow = true;
            obs.receiveShadow = true;
            this.scene.add(obs);

            // Mark as obstacle in pathfinding (approximate size)
            // Obstacle is 4x4, centered.
            const halfSize = 2;
            const startX = pos.x - halfSize;
            const endX = pos.x + halfSize;
            const startZ = pos.z - halfSize;
            const endZ = pos.z + halfSize;

            for (let x = startX; x <= endX; x++) {
                for (let z = startZ; z <= endZ; z++) {
                    this.pathfindingManager.setObstacle(x, z, false);
                }
            }
        });
    }

    private updateSelectables() {
        this.interactionManager.selectables = [
            ...this.units.map(u => u.mesh),
            ...this.buildings.map(b => b.mesh),
            ...this.resources.map(r => r.mesh)
        ];
    }

    private checkWinCondition() {
        // Check if player base is destroyed
        const playerBase = this.buildings.find(b => b instanceof CommandCore && b.faction === Faction.Enforcers);
        if (!playerBase || playerBase.health <= 0) {
            alert('Game Over! Your Command Core was destroyed.');
            // Stop loop or reset
        }

        // Check if enemy base is destroyed (mock)
        // If we had enemy base...
    }

    private setupResources(): void {
        const resources = [
            { pos: new THREE.Vector3(-20, 0, -20), type: ResourceType.Metal, amount: 500 },
            { pos: new THREE.Vector3(20, 0, 20), type: ResourceType.Energy, amount: 300 }
        ];

        resources.forEach((res, i) => {
            const node = new ResourceNode(i, res.pos, res.type, res.amount);
            this.resources.push(node);
            this.scene.add(node.mesh);
        });
    }

    private setupBuildings(): void {
        // Enforcer Base (North)
        const coreEnforcer = new CommandCore(1, new THREE.Vector3(0, 1.5, -300), Faction.Enforcers);
        this.buildings.push(coreEnforcer);
        this.scene.add(coreEnforcer.mesh);

        // Civilian Base (South West)
        const coreCivilian = new CommandCore(2, new THREE.Vector3(-260, 1.5, 150), Faction.Civilians);
        this.buildings.push(coreCivilian);
        this.scene.add(coreCivilian.mesh);

        // Terraformer Base (South East)
        const coreTerraformer = new CommandCore(3, new THREE.Vector3(260, 1.5, 150), Faction.Terraformers);
        this.buildings.push(coreTerraformer);
        this.scene.add(coreTerraformer.mesh);

        // Mark as obstacle
        this.buildings.forEach(b => {
            const halfSize = 2;
            const pos = b.mesh.position;
            for (let x = pos.x - halfSize; x <= pos.x + halfSize; x++) {
                for (let z = pos.z - halfSize; z <= pos.z + halfSize; z++) {
                    this.pathfindingManager.setObstacle(x, z, false);
                }
            }
        });
    }

    private setupUnits(): void {
        // Enforcers (North Team)
        this.units.push(new ScrapDrone(101, new THREE.Vector3(-5, 1, -290)));
        this.units.push(new ScrapDrone(102, new THREE.Vector3(5, 1, -290)));
        this.units.push(new Peacekeeper(103, new THREE.Vector3(0, 1, -280)));

        // Civilians (South West Team)
        this.units.push(new SecurityDrone(201, new THREE.Vector3(-260, 1, 165)));

        // Terraformers (South East Team)
        this.units.push(new PlasmaCutter(301, new THREE.Vector3(260, 1, 165)));
        this.units.push(new Thumper(302, new THREE.Vector3(270, 1, 165)));

        this.units.forEach(unit => {
            // Check if already added to avoid duplicates if setupUnits called multiple times?
            // Actually, setupUnits should only be called once.
            // But previous code was pushing to local 'units' then looping.
            // I'll just push directly to this.units and scene.
            if (!unit.mesh.parent) {
                this.scene.add(unit.mesh);

                // Wire up callbacks
                unit.findPathCallback = (start, end) => this.pathfindingManager.findPath(start, end);
                unit.onDropoffCallback = (amount, type) => {
                    if (type === ResourceType.Metal) this.resourceManager.addMetal(amount);
                    if (type === ResourceType.Energy) this.resourceManager.addEnergy(amount);
                };
            }
        });
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    public update(deltaTime: number): void {
        this.cameraController.update(deltaTime);
        this.gridManager.update(deltaTime, this.units);
        this.buildings.forEach(building => {
            const produced = building.update(deltaTime);
            if (produced) {
                // Spawn unit
                // For now, spawn near building
                const spawnPos = building.mesh.position.clone().add(new THREE.Vector3(5, 0, 0)); // Simplified
                if (produced === 'ScrapDrone') {
                    const unit = new ScrapDrone(Date.now(), spawnPos);
                    unit.findPathCallback = (s, e) => this.pathfindingManager.findPath(s, e);
                    unit.onDropoffCallback = (amt, type) => {
                        if (type === ResourceType.Metal) this.resourceManager.addMetal(amt);
                        if (type === ResourceType.Energy) this.resourceManager.addEnergy(amt);
                    };
                    this.units.push(unit);
                    this.scene.add(unit.mesh);
                }
            }
        });
        this.units.forEach(unit => {
            unit.update(deltaTime);

            // Thumper Logic (Auto-Stomp)
            if (unit instanceof Thumper && unit.canStomp()) {
                const enemies = this.units.filter(u => u.faction !== unit.faction && u.health > 0);
                // Check if any enemy is in range before stomping
                const hasEnemyInRange = enemies.some(e => unit.mesh.position.distanceTo(e.mesh.position) <= 8);
                if (hasEnemyInRange) {
                    unit.stomp(enemies);
                }
            }
        });
        this.projectileManager.update(deltaTime);
        this.checkWinCondition();
    }

    public render(): void {
        this.renderer.clear(); // Manual clear
        this.composer.render();
        this.minimap.render();
    }
}
