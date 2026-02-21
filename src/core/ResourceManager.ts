export class ResourceManager {
    private metal: number = 0;
    private energy: number = 0;
    private onResourceChange: ((metal: number, energy: number) => void) | null = null;

    constructor(initialMetal: number = 0, initialEnergy: number = 0) {
        this.metal = initialMetal;
        this.energy = initialEnergy;
    }

    public setCallback(callback: (metal: number, energy: number) => void) {
        this.onResourceChange = callback;
        // Trigger immediately
        this.notify();
    }

    public addMetal(amount: number) {
        this.metal += amount;
        this.notify();
    }

    public addEnergy(amount: number) {
        this.energy += amount;
        this.notify();
    }

    public spend(metal: number, energy: number): boolean {
        if (this.metal >= metal && this.energy >= energy) {
            this.metal -= metal;
            this.energy -= energy;
            this.notify();
            return true;
        }
        return false;
    }

    public getResources() {
        return { metal: this.metal, energy: this.energy };
    }

    private notify() {
        if (this.onResourceChange) {
            this.onResourceChange(this.metal, this.energy);
        }
    }
}
