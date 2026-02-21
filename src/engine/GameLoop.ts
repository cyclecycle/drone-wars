import { SceneManager } from './SceneManager';

export class GameLoop {
    private sceneManager: SceneManager;
    private lastTime: number = 0;
    private running: boolean = false;
    private animationFrameId: number | null = null;

    constructor(sceneManager: SceneManager) {
        this.sceneManager = sceneManager;
        this.loop = this.loop.bind(this);
    }

    public start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop(): void {
        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private loop(time: number): void {
        if (!this.running) return;

        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.sceneManager.update(deltaTime);
        // Here we will update game logic (ECS) later

        this.sceneManager.render();

        this.animationFrameId = requestAnimationFrame(this.loop);
    }
}
