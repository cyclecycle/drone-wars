# Drone Wars - Development Plan

Based on `SPEC.md`, this plan outlines the architecture, modular design, and phased development approach for the Drone Wars RTS.

## 1. Architecture & Modular Design

To ensure separation of concerns and testability, the project will follow a component-based architecture (simplified ECS or composition over inheritance) separating the **View** (Three.js) from the **Logic** (Game State).

### Tech Stack
*   **Language:** TypeScript (for type safety and better refactoring).
*   **Rendering:** Three.js.
*   **Build Tool:** Vite.
*   **Testing:** Vitest (Unit/Integration), Cypress (E2E/UI interaction).
*   **Pathfinding:** Pathfinding.js or custom A* implementation.

### Core Modules

1.  **Engine/Renderer (`/src/engine`)**
    *   Responsible for the Three.js scene, camera, and render loop.
    *   **Components:** `GameLoop`, `SceneManager`, `InputHandler` (Raycasting).
    *   *Design Pattern:* The Engine emits events (e.g., "UnitSelected") but does not handle game rules.

2.  **Game Logic (`/src/core`)**
    *   Pure logic handling state, entities, and rules. Decoupled from Three.js meshes.
    *   **Entities:** Units, Buildings, Resources.
    *   **Systems:** `MovementSystem`, `CombatSystem`, `ResourceSystem`, `PathfindingSystem`.
    *   *Design Pattern:* State is the single source of truth. The Renderer observes State changes to update Meshes.

3.  **Factions (`/src/factions`)**
    *   Modular definitions for units and buildings.
    *   **Enforcers:** `EnforcerFactory`, `ArtilleryLogic`.
    *   **Civilians:** `GridSystem` (Aura logic), `ShieldLogic`.
    *   **Terraformers:** `BeamWeaponLogic`, `TerrainDeformation`.

4.  **UI Layer (`/src/ui`)**
    *   HTML/CSS overlay.
    *   Subscribes to Game State changes (resources, selection) to update DOM.

---

## 2. Testing Strategy

*   **Unit Testing (Vitest):**
    *   Test math helpers (distance, collision).
    *   Test game logic (e.g., "Does `takeDamage()` reduce HP correctly?", "Does `Grid` buff apply within radius?").
    *   Mock Three.js objects where necessary to test logic without a canvas.
*   **Integration Testing:**
    *   Test interaction between systems (e.g., MovementSystem correctly updating Entity position which then updates Renderer).
*   **Visual Debugging:**
    *   Debug helpers for Pathfinding grids and Raycast lines.

---

## 3. Development Phases

### Phase 1: Foundation & Engine Setup
*   [x] **Project Scaffold:** Setup Vite, TypeScript, Three.js, Vitest.
*   [x] **Game Loop:** Implement a robust `requestAnimationFrame` loop with delta time.
*   [x] **Map & Camera:**
    *   Create a flat plane map with obstacles.
    *   Implement RTS Camera (WASD, Pan, Zoom).
*   [x] **Unit Rendering:** Abstract `Renderable` component to sync Logic Entity $\to$ Three.js Mesh.

### Phase 2: Core RTS Mechanics
*   [ ] **Selection System:**
    *   [x] Implement Raycaster for single select.
    *   [x] Implement Selection Box for multi-select.
*   [x] **Movement & Pathfinding:**
    *   [x] Integrate A* grid.
    *   [x] Implement `MoveCommand`: Click $\to$ Calculate Path $\to$ Move Unit along nodes.
    *   [x] Basic collision avoidance (Static obstacles).
*   [x] **UI Framework:**
    *   [x] HTML Overlay setup.
    *   [x] Event bus for `Selection` $\to$ `Update UI Panel`.

### Phase 3: Faction Mechanics (Iterative)
*   [x] **The Enforcers (Baseline):**
    *   [x] Implement `Unit` base class.
    *   [x] Create `Scrap Drone` (Gathering logic placeholder) and `Peacekeeper` (Projectile logic).
    *   [x] Implement `ProjectileSystem`.
*   [x] **The Civilians (The Grid):**
    *   [x] Implement `GridSystem` (Aura detection).
    *   [x] [x] Implement `Security Drone` shield logic (active inside grid vs disabled outside).
*   [x] **The Terraformers (Physics):**
    *   [x] Implement `Plasma Cutter` beam mechanics (damage ramping).
    *   [x] Implement `Thumper` AoE logic.

### Phase 4: Economy & Gameloop
*   [x] **Resource System:** Gathering Metal/Energy.
*   [x] **Building System:** Placement grid, construction logic.
*   [x] **Win Condition:** Detect `MainBase` destruction.

---

## 4. Completion
All phases have been implemented. The project now supports:
*   RTS Camera and Interaction.
*   Three unique factions with distinct units.
*   Resource gathering loop.
*   Building construction mechanics.
*   Basic win condition.
