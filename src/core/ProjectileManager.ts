import * as THREE from 'three';
import { Projectile } from './Projectile';
import { Unit } from './Unit';

export class ProjectileManager {
    private projectiles: Projectile[] = [];
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public createProjectile(
        position: THREE.Vector3,
        target: Unit,
        speed: number,
        damage: number
    ) {
        const projectile = new Projectile(
            position,
            target,
            speed,
            damage,
            (hitTarget, dmg) => this.onProjectileHit(hitTarget, dmg)
        );
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
    }

    private onProjectileHit(target: Unit, damage: number) {
        target.health -= damage;
        if (target.health <= 0) {
            target.health = 0;
            // TODO: Handle unit death
        }
        console.log(`${target.name} hit! Health: ${target.health}`);
    }

    public update(deltaTime: number) {
        this.projectiles = this.projectiles.filter(p => {
            const active = p.update(deltaTime);
            if (!active) {
                this.scene.remove(p.mesh);
            }
            return active;
        });
    }
}
