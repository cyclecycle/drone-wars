import * as THREE from 'three';

export class Minimap {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private mapCamera: THREE.OrthographicCamera;
    private mainCamera: THREE.PerspectiveCamera;
    private mapSize: number;
    private width: number = 200;
    private height: number = 200;

    private viewBox: THREE.LineLoop;
    public onNavigate: ((target: THREE.Vector3) => void) | null = null;

    constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, mapSize: number, mainCamera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.renderer = renderer;
        this.mapSize = mapSize;
        this.mainCamera = mainCamera;

        // Interaction
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));

        // Setup Top-Down Ortho Camera
        const frustumSize = mapSize;
        this.mapCamera = new THREE.OrthographicCamera(
            frustumSize / -2, frustumSize / 2,
            frustumSize / 2, frustumSize / -2,
            1, 2000
        );
        this.mapCamera.position.set(0, 1000, 0);
        this.mapCamera.lookAt(0, 0, 0);
        this.mapCamera.layers.enable(1); // Enable Layer 1 for icons

        // View Box
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -10, 0, -10,
            10, 0, -10,
            10, 0, 10,
            -10, 0, 10
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.viewBox = new THREE.LineLoop(geometry, material);
        this.viewBox.position.y = 20; // Above terrain and icons
        this.viewBox.layers.set(1);
        this.scene.add(this.viewBox);
    }

    private updateViewBox() {
        // Project camera frustum to ground plane
        this.mainCamera.updateMatrixWorld();
        this.mainCamera.updateProjectionMatrix(); // Ensure up to date

        // We need 4 corners of the screen raycasted to Y=0 plane
        const corners = [
            new THREE.Vector3(-1, -1, 0.5), // BL
            new THREE.Vector3(1, -1, 0.5),  // BR
            new THREE.Vector3(1, 1, 0.5),   // TR
            new THREE.Vector3(-1, 1, 0.5)   // TL
        ];

        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const raycaster = new THREE.Raycaster();

        const positions = this.viewBox.geometry.attributes.position;

        corners.forEach((ndc, i) => {
            raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.mainCamera);
            const target = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, target);
            if (target) {
                positions.setXYZ(i, target.x, 20, target.z);
            }
        });
        positions.needsUpdate = true;
    }

    public render() {
        this.updateViewBox();

        // Save current state
        const w = window.innerWidth;
        const h = window.innerHeight;
        const oldFog = this.scene.fog;

        // Disable fog for clarity
        this.scene.fog = null;

        // Render Minimap in bottom-left corner
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(10, 10, this.width, this.height);
        this.renderer.setViewport(10, 10, this.width, this.height);

        this.renderer.render(this.scene, this.mapCamera);

        // Restore state
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, w, h);
        this.scene.fog = oldFog;
    }

    private onPointerDown(event: PointerEvent) {
        if (event.button !== 0) return; // Left click only

        // Calculate coords relative to canvas
        // Canvas is full screen usually
        const rect = this.renderer.domElement.getBoundingClientRect();
        // Mouse coords (Top-Left 0,0)
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Minimap rect (Bottom-Left 10,10, w=200, h=200)
        // Convert to Top-Left Y
        // Bottom 10 means Y = windowHeight - 10 - 200 = windowHeight - 210 (Top) to windowHeight - 10 (Bottom)

        const mapLeft = 10;
        const mapTop = rect.height - 10 - this.height;
        const mapRight = mapLeft + this.width;
        const mapBottom = mapTop + this.height;

        if (mouseX >= mapLeft && mouseX <= mapRight && mouseY >= mapTop && mouseY <= mapBottom) {
            // Inside minimap
            event.stopPropagation(); // Prevent unit selection behind minimap?
            // Actually InteractionManager listens too. We might need to stop it there or here.

            // Normalized 0-1
            const u = (mouseX - mapLeft) / this.width;
            const v = (mouseY - mapTop) / this.height; // 0 at top, 1 at bottom

            // Map u,v to World X,Z
            // Ortho Cam: Left=-400, Right=400, Top=400, Bottom=-400 (if mapSize=800)
            // U=0 -> Left (-400), U=1 -> Right (400)
            // V=0 -> Top (-400 Z ?? No, Top is -Z usually in standard map logic, but wait)
            // Ortho Camera orientation:
            // position (0, 1000, 0), lookAt(0,0,0). Rotation X = -90 deg.
            // Up is (0,1,0) before rotation?
            // Usually Three.js: +Y Up on screen corresponds to -Z in world if Camera X=-90.

            // So Top of Minimap (V=0) is -Z (-400).
            // Bottom of Minimap (V=1) is +Z (400).

            const worldX = (u - 0.5) * this.mapSize;
            const worldZ = (v - 0.5) * this.mapSize;

            if (this.onNavigate) {
                this.onNavigate(new THREE.Vector3(worldX, 0, worldZ));
            }
        }
    }
}
