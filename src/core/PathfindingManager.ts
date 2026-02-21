import * as THREE from 'three';

export class PathfindingManager {
    private width: number;
    private height: number;
    private scale: number;
    private grid: Uint8Array; // 0 = empty, 1 = obstacle

    constructor(mapSize: number, scale: number = 1) {
        this.width = Math.ceil(mapSize / scale);
        this.height = Math.ceil(mapSize / scale);
        this.scale = scale;
        this.grid = new Uint8Array(this.width * this.height);
    }

    public setObstacle(x: number, z: number, isObstacle: boolean) {
        // Convert world to grid
        const gx = Math.floor(x / this.scale + this.width / 2);
        const gy = Math.floor(z / this.scale + this.height / 2);
        
        if (gx >= 0 && gx < this.width && gy >= 0 && gy < this.height) {
            this.grid[gy * this.width + gx] = isObstacle ? 1 : 0;
        }
    }

    public isWalkableAt(x: number, z: number): boolean {
        const gx = Math.floor(x / this.scale + this.width / 2);
        const gy = Math.floor(z / this.scale + this.height / 2);
        if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
        return this.grid[gy * this.width + gx] === 0;
    }

    public findPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
        const startNode = {
            x: Math.floor(start.x / this.scale + this.width / 2),
            y: Math.floor(start.z / this.scale + this.height / 2),
            g: 0, h: 0, f: 0, parent: null as any
        };
        const endNode = {
            x: Math.floor(end.x / this.scale + this.width / 2),
            y: Math.floor(end.z / this.scale + this.height / 2)
        };

        // Validate bounds
        if (!this.isValid(startNode.x, startNode.y) || !this.isValid(endNode.x, endNode.y)) return [];

        // Check if target is blocked (Simple check)
        // If blocked, we could search neighbors, but for now return empty or path to edge
        if (this.isBlocked(endNode.x, endNode.y)) {
            return []; 
        }

        // A* Implementation
        const openList: any[] = [startNode];
        const closedList = new Set<number>(); // Key = y * width + x

        // Neighbors (8 directions)
        const neighbors = [
            { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
            { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 }
        ];

        // Safety break
        let iterations = 0;
        const maxIterations = 5000; // Limit search depth for responsiveness

        while (openList.length > 0) {
            iterations++;
            if (iterations > maxIterations) {
                console.warn("Pathfinding timeout");
                return []; // Fail gracefully
            }

            // Get lowest F (Naive linear search for simplicity, Heap is faster but more code)
            // For < 100 units open list, linear is ok. For large maps, Heap is needed.
            let lowestIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < openList[lowestIndex].f) lowestIndex = i;
            }
            const current = openList[lowestIndex];

            // Found Goal
            if (current.x === endNode.x && current.y === endNode.y) {
                // Reconstruct
                const path: THREE.Vector3[] = [];
                let curr = current;
                while (curr) {
                    path.push(new THREE.Vector3(
                        (curr.x - this.width / 2) * this.scale + this.scale / 2,
                        0,
                        (curr.y - this.height / 2) * this.scale + this.scale / 2
                    ));
                    curr = curr.parent;
                }
                return this.smoothPath(path.reverse());
            }

            // Close current
            openList.splice(lowestIndex, 1);
            closedList.add(current.y * this.width + current.x);

            // Neighbors
            for (const offset of neighbors) {
                const nx = current.x + offset.x;
                const ny = current.y + offset.y;
                const nid = ny * this.width + nx;

                if (!this.isValid(nx, ny) || this.isBlocked(nx, ny) || closedList.has(nid)) {
                    continue;
                }

                // Diagonal wall check
                if (Math.abs(offset.x) === 1 && Math.abs(offset.y) === 1) {
                    if (this.isBlocked(current.x + offset.x, current.y) || this.isBlocked(current.x, current.y + offset.y)) {
                        continue;
                    }
                }

                const gScore = current.g + ((offset.x === 0 || offset.y === 0) ? 1 : 1.414);
                
                let neighbor = openList.find(n => n.x === nx && n.y === ny);
                if (!neighbor) {
                    const h = Math.abs(nx - endNode.x) + Math.abs(ny - endNode.y); // Manhattan is faster
                    neighbor = { x: nx, y: ny, parent: current, g: gScore, h: h, f: gScore + h };
                    openList.push(neighbor);
                } else if (gScore < neighbor.g) {
                    neighbor.g = gScore;
                    neighbor.parent = current;
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }

        return [];
    }

    private isValid(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    private isBlocked(x: number, y: number): boolean {
        return this.grid[y * this.width + x] === 1;
    }

    private smoothPath(path: THREE.Vector3[]): THREE.Vector3[] {
        if (path.length <= 2) return path;
        const smooth: THREE.Vector3[] = [path[0]];
        let currentIdx = 0;

        while (currentIdx < path.length - 1) {
            let nextIdx = currentIdx + 1;
            // Look ahead
            for (let i = path.length - 1; i > currentIdx + 1; i--) {
                if (this.hasLineOfSight(path[currentIdx], path[i])) {
                    nextIdx = i;
                    break;
                }
            }
            smooth.push(path[nextIdx]);
            currentIdx = nextIdx;
        }
        return smooth;
    }

    private hasLineOfSight(start: THREE.Vector3, end: THREE.Vector3): boolean {
        let x0 = Math.floor(start.x / this.scale + this.width / 2);
        let y0 = Math.floor(start.z / this.scale + this.height / 2);
        let x1 = Math.floor(end.x / this.scale + this.width / 2);
        let y1 = Math.floor(end.z / this.scale + this.height / 2);

        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (this.isBlocked(x0, y0)) return false;
            if (x0 === x1 && y0 === y1) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return true;
    }
}
