import { Unit } from '../core/Unit';
import { Building } from '../core/Building';

export class UIManager {
    private container: HTMLElement;
    private selectionPanel: HTMLElement;
    private resourcePanel: HTMLElement;

    constructor() {
        this.container = document.getElementById('ui-layer')!;
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // Click through
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'space-between';
        this.container.style.padding = '10px';
        this.container.style.boxSizing = 'border-box';

        // Resources
        this.resourcePanel = document.createElement('div');
        this.resourcePanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.resourcePanel.style.color = '#fff';
        this.resourcePanel.style.padding = '10px';
        this.resourcePanel.style.borderRadius = '5px';
        this.resourcePanel.style.pointerEvents = 'auto';
        this.resourcePanel.innerText = 'Resources: Metal: 100 | Energy: 50';
        this.container.appendChild(this.resourcePanel);

        // Selection (Bottom Center)
        this.selectionPanel = document.createElement('div');
        this.selectionPanel.style.position = 'absolute';
        this.selectionPanel.style.bottom = '10px';
        this.selectionPanel.style.left = '50%';
        this.selectionPanel.style.transform = 'translateX(-50%)';
        this.selectionPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.selectionPanel.style.color = '#fff';
        this.selectionPanel.style.padding = '10px';
        this.selectionPanel.style.minWidth = '200px';
        this.selectionPanel.style.borderRadius = '5px';
        this.selectionPanel.style.pointerEvents = 'auto';
        this.selectionPanel.innerText = 'No selection';
        this.container.appendChild(this.selectionPanel);

        // Minimap Border (Bottom Left)
        const minimapBorder = document.createElement('div');
        minimapBorder.style.position = 'absolute';
        minimapBorder.style.left = '10px';
        minimapBorder.style.bottom = '10px';
        minimapBorder.style.width = '200px';
        minimapBorder.style.height = '200px';
        minimapBorder.style.border = '2px solid rgba(0, 255, 255, 0.5)';
        minimapBorder.style.pointerEvents = 'none';
        this.container.appendChild(minimapBorder);
    }

    public updateResources(metal: number, energy: number) {
        this.resourcePanel.innerText = `Resources: Metal: ${metal} | Energy: ${energy}`;
    }

    public updateSelection(selection: (Unit | Building)[]) {
        if (selection.length === 0) {
            this.selectionPanel.innerText = 'No selection';
        } else if (selection.length === 1) {
            const obj = selection[0];
            if (obj instanceof Unit) {
                this.selectionPanel.innerHTML = `
                    <h3 style="margin: 0 0 5px 0">${obj.name}</h3>
                    <p style="margin: 0">Health: ${Math.floor(obj.health)} / ${obj.maxHealth}</p>
                    <p style="margin: 0">ID: ${obj.id}</p>
                `;
            } else if (obj instanceof Building) {
                this.selectionPanel.innerHTML = `
                    <h3 style="margin: 0 0 5px 0">${obj.name}</h3>
                    <p style="margin: 0">Health: ${obj.health} / ${obj.maxHealth}</p>
                    <p style="margin: 0">Queue: ${obj.productionQueue.length}</p>
                `;
            }
        } else {
            this.selectionPanel.innerHTML = `
                <h3 style="margin: 0 0 5px 0">Multi-Selection</h3>
                <p style="margin: 0">Count: ${selection.length}</p>
            `;
        }
    }
}
