import * as THREE from 'three';

export class InteractionManager {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private camera: THREE.Camera;
    private domElement: HTMLElement;

    public selectables: THREE.Object3D[] = [];
    public selected: THREE.Object3D[] = [];
    public ground: THREE.Object3D | null = null;
    public onRightClick: ((point: THREE.Vector3, target?: THREE.Object3D) => void) | null = null;
    public onSelectionChanged: ((selected: THREE.Object3D[]) => void) | null = null;

    private selectionBox: HTMLDivElement;
    private startPoint: THREE.Vector2 = new THREE.Vector2();
    private isDragging: boolean = false;

    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.domElement.addEventListener('contextmenu', (e) => this.onContextMenu(e));

        // Create selection box element
        this.selectionBox = document.createElement('div');
        this.selectionBox.style.position = 'absolute';
        this.selectionBox.style.border = '1px solid #00ff00';
        this.selectionBox.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        this.selectionBox.style.pointerEvents = 'none'; // Allow clicks to pass through
        this.selectionBox.style.display = 'none';
        document.body.appendChild(this.selectionBox);
    }

    private onContextMenu(event: MouseEvent) {
        event.preventDefault(); // Prevent browser menu
        if (!this.ground || !this.onRightClick) return;

        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check units first
        const unitIntersects = this.raycaster.intersectObjects(this.selectables, false);
        if (unitIntersects.length > 0) {
            this.onRightClick(unitIntersects[0].point, unitIntersects[0].object);
            return;
        }

        // Then check ground
        const intersects = this.raycaster.intersectObject(this.ground);

        if (intersects.length > 0) {
            this.onRightClick(intersects[0].point);
        }
    }

    private onPointerDown(event: PointerEvent) {
        if (event.button !== 0) return; // Only left click

        this.isDragging = false;
        this.startPoint.set(event.clientX, event.clientY);

        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
    }

    private onPointerMove = (event: PointerEvent) => {
        const dist = this.startPoint.distanceTo(new THREE.Vector2(event.clientX, event.clientY));

        if (dist > 5) {
            this.isDragging = true;
            this.updateSelectionBox(event.clientX, event.clientY);
        }
    }

    private onPointerUp = (event: PointerEvent) => {
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);

        if (this.isDragging) {
            this.finalizeSelectionBox(event.clientX, event.clientY, event.shiftKey);
            this.selectionBox.style.display = 'none';
        } else {
            this.performClickSelection(event);
        }

        this.isDragging = false;
    }

    private updateSelectionBox(currentX: number, currentY: number) {
        const minX = Math.min(this.startPoint.x, currentX);
        const maxX = Math.max(this.startPoint.x, currentX);
        const minY = Math.min(this.startPoint.y, currentY);
        const maxY = Math.max(this.startPoint.y, currentY);

        this.selectionBox.style.left = minX + 'px';
        this.selectionBox.style.top = minY + 'px';
        this.selectionBox.style.width = (maxX - minX) + 'px';
        this.selectionBox.style.height = (maxY - minY) + 'px';
        this.selectionBox.style.display = 'block';
    }

    private finalizeSelectionBox(endX: number, endY: number, shiftKey: boolean) {
        if (!shiftKey) {
            this.clearSelection(false); // Don't notify yet
        }

        const minX = Math.min(this.startPoint.x, endX);
        const maxX = Math.max(this.startPoint.x, endX);
        const minY = Math.min(this.startPoint.y, endY);
        const maxY = Math.max(this.startPoint.y, endY);

        let changed = false;
        // Check each selectable
        this.selectables.forEach(obj => {
            // Project object position to screen space
            const pos = obj.position.clone();
            pos.project(this.camera);

            // Convert to screen coords
            const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-(pos.y * 0.5) + 0.5) * window.innerHeight;

            if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
                if (!this.selected.includes(obj)) {
                    this.selected.push(obj);
                    this.highlight(obj, true);
                    changed = true;
                }
            }
        });

        if (changed || !shiftKey) {
            this.notifySelectionChanged();
        }
    }

    private performClickSelection(event: PointerEvent) {
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.selectables, false);

        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;

            if (!event.shiftKey) {
                this.clearSelection(false);
            }

            if (!this.selected.includes(selectedObject)) {
                this.selected.push(selectedObject);
                this.highlight(selectedObject, true);
                this.notifySelectionChanged();
            } else if (!event.shiftKey) {
                // If previously selected, keep it selected (re-add to ensure order/logic if needed, or just notify)
                // Actually if it's already selected and !shiftKey, we cleared others, so we just ensure this one is highlighted/selected.
                if (!this.selected.includes(selectedObject)) {
                    this.selected.push(selectedObject);
                    this.highlight(selectedObject, true);
                }
                this.notifySelectionChanged();
            }
        } else {
            if (!event.shiftKey) {
                this.clearSelection(true);
            }
        }
    }

    private highlight(object: THREE.Object3D, isSelected: boolean) {
        if (object.userData.unit) {
            object.userData.unit.setSelected(isSelected);
        } else if (object.userData.building) {
            // Buildings might not have setSelected logic yet, or we can add it.
            // For now, maybe just keep old highlight for buildings?
            // No, user said "no glow".
            // If building has setSelected, call it.
            if (object.userData.building.setSelected) {
                object.userData.building.setSelected(isSelected);
            }
        }
        // Fallback for simple meshes (Resources)
        else if (object instanceof THREE.Mesh) {
            const material = object.material as THREE.MeshStandardMaterial;
            if (material && material.emissive) {
                // Only highlight if it's a resource (ResourceNode)
                if (object.userData.resourceNode) {
                    material.emissive.setHex(isSelected ? 0x00ff00 : 0x000000);
                }
            }
        }
    }

    private clearSelection(notify: boolean = true) {
        this.selected.forEach(obj => this.highlight(obj, false));
        this.selected = [];
        if (notify) this.notifySelectionChanged();
    }

    private notifySelectionChanged() {
        if (this.onSelectionChanged) {
            this.onSelectionChanged(this.selected);
        }
    }
}
