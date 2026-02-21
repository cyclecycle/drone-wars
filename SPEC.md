### 1. Three.js Engine & Architecture Requirements

Before the factions can fight, your development team needs to build the stage. The engine should separate the 3D rendering loop from the game logic (like using an Entity-Component-System or finite state machines).

* **Camera Controls:** A standard `PerspectiveCamera` angled downward. Implement mouse-edge panning, WASD panning, and scroll-wheel zooming.
* **Unit Selection (Raycasting):** Implement Three.js `Raycaster` to detect clicks on unit bounding boxes. For drag-to-select, project a 2D HTML box onto the 3D scene to select multiple units within a frustum.
* **Pathfinding:** Don't write this from scratch. Use a grid-based A* algorithm (like `Pathfinding.js`) or a NavMesh system. Units need basic collision avoidance so they don't clip through each other.
* **UI Overlay:** Do not build the UI in WebGL. Use standard HTML/CSS overlaid on top of the Three.js `<canvas>`. When a unit is selected, the game logic sends an event to the DOM to populate the UI panel with stats, portraits, and action buttons.
* **The Map:** A simple flat plane with some impassable obstacles (rocks/chasms) and designated resource nodes (Metal deposits and Energy vents).

---

### 2. The Enforcers (Baseline Military)

**Core Mechanic:** Traditional, sturdy, and straightforward. They test your engine's basic combat math, pathfinding, and standard RTS build orders.

**Buildings:**

* **Command Core:** The central hub. Produces workers and stores resources.
* **Assembly Plant:** Produces all combat units.
* **Munitions Depot:** A tech building. Unlocks the Artillery Mech and provides passive damage upgrades.

**Units:**

* **Scrap Drone (Worker):** Standard gatherer. Moves between resource nodes and the Command Core.
* **Peacekeeper (Basic Ranged):** A standard bipedal mech with an assault rifle. Good fire rate, moderate health.
* **Artillery Mech (Heavy):** Slow-moving, long-range walker. Fires explosive shells that test your engine's Area of Effect (AoE) damage calculations.

---

### 3. The Civilians (The Grid Network)

**Core Mechanic:** The Grid. Buildings and units rely on a Wi-Fi-like aura. They test your engine's spatial logic, auras, and buff/debuff systems.

**Buildings:**

* **Server Hub:** The main base. Emits a large "Grid" radius.
* **Relay Node:** A cheap, fragile pylon. Expands the Grid radius across the map.
* **Print Station:** Produces units. *Must* be built within the Grid.

**Units:**

* **Delivery Bot (Worker):** Hovers. Very fast, but carries fewer resources per trip than the Enforcer drone.
* **Security Drone (Basic Ranged):** A floating turret. *Mechanic test:* When inside the Grid, it has a regenerating energy shield. Outside the Grid, it loses the shield and moves 30% slower.
* **EMP Caster (Support):** A fragile spellcaster. *Mechanic test:* Has an active ability (triggered via UI) that temporarily stuns an enemy unit or disables an enemy building in a small radius.

---

### 4. The Terraformers (Industrial Manipulators)

**Core Mechanic:** Environmental interaction and massive durability. They test continuous damage logic and dynamic terrain.

**Buildings:**

* **Mining Rig:** The main base.
* **Excavation Bay:** Produces units. Extremely high hit points.
* **Slag Processor:** Tech building. Grants the Thumper unit the ability to create temporary walls.

**Units:**

* **Hauler (Worker):** Very slow, massive hit box, but carries 3x the resources of other workers.
* **Plasma Cutter (Basic Melee/Short Range):** A walking industrial torch. *Mechanic test:* Uses a continuous beam weapon. The longer it locks onto a single target, the higher the damage scales per second.
* **Thumper (Heavy Utility):** A massive seismic vehicle. *Mechanic test:* Does not shoot. Instead, it pounds the ground, dealing AoE damage to nearby enemies and slowing their movement speed. Can instantly destroy "destructible rocks" on the map to open new pathways.

---

### PoC Gameplay Loop & Win Condition

For the beta, the goal is simply to ensure the mechanics work together smoothly.

1. Players spawn with a Main Base and 3 Workers.
2. They gather Metal and Energy to build their production facility.
3. They produce an army of 10-15 units.
4. **Win Condition:** Destroy the enemy's Main Base.
