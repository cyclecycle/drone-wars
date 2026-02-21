The goal for an RTS PoC should be **readability and atmosphere**. You want a style that is relatively cheap to produce but looks incredibly deliberate and polished.

Here is a lean, high-impact art specification tailored for a Three.js implementation.

### The Overall Visual Style: "Stylized Hard-Surface (3D Proxies)"

Think *StarCraft II*, *Planetary Annihilation* or *Deep Rock Galactic*. We want chunky, low-to-medium polygon models with strong silhouettes.

* **The Approach (3D Proxies):** Instead of complex 3D models or 2D sprites, we will build units and buildings using **Composite Three.js Primitives** (Boxes, Cylinders, Cones) grouped together.
* **The "Secret Sauce":**
    *   **Textures:** Apply seamless AI-generated "Sci-Fi Metal/Paneling" textures to these primitives.
    *   **Emissive Maps:** Use `MeshStandardMaterial` with bright emissive colors for lights/vents.
    *   **Post-Processing:** A Bloom Pass will make the emissive parts glow, selling the sci-fi look.

---

### 1. Faction Visual Identity & 3D Assets

Every faction needs a strict color palette and shape language so players can instantly tell who is who on a zoomed-out battlefield.

**The Enforcers (Military)**

* **Shape Language:** Symmetrical, sharp angles, triangular.
* **Color Palette:** Dark gunmetal grey with **Crimson Red** emissive lights.
* **Asset List (5 total):** 1 chunky Command Core, 1 blocky Assembly Plant, 1 treaded Worker drone, 1 bipedal Peacekeeper mech, 1 heavy Artillery walker.

**The Civilians (The Grid)**

* **Shape Language:** Sleek, rounded, floating, Apple-esque but repurposed.
* **Color Palette:** Glossy white or polished chrome with **Cyan/Neon Blue** emissive lights.
* **Asset List (5 total):** 1 floating Server Hub, 1 vertical Relay Node (looks like a futuristic cell tower), 1 hovering Delivery Worker, 1 Security Turret drone, 1 EMP spellcaster with rotating magnetic rings.

**The Terraformers (Industrial)**

* **Shape Language:** Asymmetrical, bulky, utilitarian, visible roll-cages and pistons.
* **Color Palette:** Scuffed hazard yellow and construction orange with **Warm White** emissive lights.
* **Asset List (5 total):** 1 sprawling Mining Rig base, 1 heavy Excavation Bay, 1 massive 6-wheeled Hauler worker, 1 Plasma Cutter mech with a visible torch nozzle, 1 bulky Thumper vehicle.

---

### 2. The Environment & Terrain

Keep the map geometry flat and simple for the PoC to ensure easy pathfinding, but make it look good through textures and lighting.

* **The Ground:** A simple Three.js `PlaneGeometry`. Use a tiling, stylized texture (like a dusty Martian surface or a metallic space-station floor). Add a subtle grid overlay texture to emphasize the RTS/tactical feel.
* **Obstacles (Destructible/Impassable):** 2-3 variations of chunky, low-poly rock formations or metallic debris piles.
* **Resources:** * **Metal:** Clusters of jagged, shiny metallic geometric shapes.
* **Energy:** A glowing crater or vent (using a bright emissive material and a simple upward-moving particle system).



---

### 3. UI/UX Approach (HTML/CSS)

Do not render the UI in the Three.js canvas. Build it purely in HTML/CSS overlaid on top with `position: absolute`. This makes it crisp, responsive, and infinitely easier to style.

* **Aesthetic:** Clean, semi-transparent "holographic" terminal UI. Dark backgrounds (`rgba(10, 10, 15, 0.8)`) with glowing borders matching the player's faction color.
* **Top Bar (Global):** * Minimalist counters for Metal, Energy, and Unit Population.
* **Bottom Middle (Selection Pane):**
* Appears when a unit/building is selected.
* Shows the unit's Name, a stylized 2D icon (or a rendered portrait), a Health Bar (green/red), and an Energy/Shield Bar (blue).


* **Bottom Right (Command Card):**
* A 3x3 grid of square buttons.
* Buttons feature simple, high-contrast flat vector icons (e.g., a wrench for "Build", a crosshair for "Attack", a silhouette for "Produce Unit").
* Include CSS `:hover` and `:active` states (like a bright border glow) so clicking feels responsive.



---

### 4. VFX & Polish (The "Juice")

This is what makes the PoC feel like a real game rather than a static 3D viewer. You don't need complex animations; you need good feedback.

* **Selection Decals:** When a unit is clicked, render a simple Three.js `RingGeometry` underneath them on the ground plane, colored to match their faction.
* **Projectiles:** Don't model bullets. Use scaled `CylinderGeometry` with bright emissive colors for lasers (Enforcers) and continuous line meshes for the plasma beams (Terraformers).
* **Explosions/Sparks:** A very basic Three.js particle system. When a unit dies, spawn 10-20 glowing square particles that scatter outward and fade out over 1 second, then delete the unit mesh.
* **The Grid Aura (Civilians):** A massive, highly transparent, slowly rotating circle on the ground plane to visually show the player where the power network ends.


---

### Asset Generation Prompts (Textures Only)

Since we are building 3D Proxies, we primarily need **Seamless Textures** to wrap around our boxes and cylinders.

| Asset Type  | Asset Name                | AI Prompt                                                                                                                                                                         |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Texture** | Sci-Fi Metal Plate        | `top down view, seamless tiling texture of dark sci-fi gunmetal hull plating, heavy rivets, subtle scratches, game texture`                                                       |
| **Texture** | Clean White Plastic       | `top down view, seamless tiling texture of sleek smooth white plastic or ceramic panels, subtle panel lines, apple aesthetic, game texture`                                       |
| **Texture** | Industrial Hazard Plate   | `top down view, seamless tiling texture of dirty industrial yellow metal with black hazard stripes, rust and oil stains, heavy machinery aesthetic, game texture`                 |
| **Texture** | Ground Dirt (Seamless)    | `top down view, seamless tiling texture of reddish-brown mars soil, packed dirt, high detail, 4k, game texture`                                                                   |
| **Texture** | Ground Grass (Seamless)   | `top down view, seamless tiling texture of sparse alien grass growing on dirt, patchy moss, slightly desaturated green, realistic game texture`                                   |
| **Texture** | Ground Tech (Seamless)    | `top down view, seamless tiling texture of sci-fi metal floor grating, hexagonal pattern, dark gunmetal, worn industrial, game texture`                                           |
| **Texture** | Ground Terrain (Seamless) | `top down view, seamless tiling texture of sci-fi dusty martian ground, reddish-brown soil with subtle metallic hexagonal grid lines embedded in the dirt, stylized game texture` |



---

### UI Icons (Flat 2D)

*These will be used in the HTML/CSS overlay. They should be clean vector-style images.*

| Asset Type | Asset Name              | AI Prompt                                                                                                                             |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Icon**   | Metal Resource Icon     | `flat vector game icon, white silhouette on dark background, a stack of metal ingots or gears, stylized minimalist ui element`        |
| **Icon**   | Energy Resource Icon    | `flat vector game icon, white silhouette on dark background, a lightning bolt inside a battery shape, stylized minimalist ui element` |
| **Icon**   | Build/Construct Command | `flat vector game icon, white silhouette on dark background, a wrench crossing a hammer, stylized minimalist ui button`               |
| **Icon**   | Attack Command          | `flat vector game icon, white silhouette on dark background, a crosshair targeting reticle, stylized minimalist ui button`            |
| **Icon**   | Stop/Halt Command       | `flat vector game icon, white silhouette on dark background, an open hand palm facing forward, stylized minimalist ui button`         |


---

The Python Post-Processing Route (Highly Recommended)
If you want to automate this for a production pipeline, post-processing generated images using Python is completely viable and surprisingly easy.

The absolute best open-source library for this is rembg.  It uses a neural network (specifically the U^2-Net architecture) trained explicitly to detect foreground subjects and cleanly strip the background, preserving alpha transparency.

Here is how simple it is to implement:

Installation:

Bash
pip install rembg pillow
The Code:

Python
from rembg import remove
from PIL import Image

def make_transparent(input_path, output_path):
    # Load your AI-generated image
    input_image = Image.open(input_path)
    
    # Pass it through the rembg model
    output_image = remove(input_image)
    
    # Save the new transparent asset
    output_image.save(output_path, "PNG")

# Example usage for your PoC assets
make_transparent("enforcer_mech_raw.jpg", "enforcer_mech_clean.png")