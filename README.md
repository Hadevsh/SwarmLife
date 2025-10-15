# SwarmLife

A tiny, dependency-free **particle life** simulation written in **pure JavaScript**, rendered in the browser. Open the page and watch colorful “species” of particles attract, repel, cluster, and swirl into emergent patterns.

## ✨ Features

* **No build step, no frameworks** — just HTML, CSS, and a single JS file.
* **Canvas-based simulation** that demonstrates Particle-Life–style rules (attraction/repulsion between groups) with simple, readable code.
* **Instant run** locally or via any static host (e.g., GitHub Pages).

## Project structure

```
SwarmLife/
├─ index.html    # Page shell + canvas
├─ script.js     # Simulation & rendering loop
└─ styles.css    # Minimal styling
```

## 🚀 Getting started

### Option A — just open the file

1. Clone or download the repo.
2. Double-click `index.html` to open it in your browser.

### Option B — serve locally (recommended)

Serving over HTTP avoids some browser security quirks.

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then visit: [http://localhost:8000/](http://localhost:8000/)

## 🧠 How it works

1. **Initialize particles** with positions and velocities (often grouped by “species”).
2. **Interaction matrix** defines how each species attracts/repels others (e.g., red→blue mildly repels, blue→red strongly attracts).
3. **Integrate** motion each frame (accumulate forces, clamp speeds, wrap or bounce at edges).
4. **Render** every frame to the `<canvas>`.

> The implementation lives in `script.js`. You’ll typically find species counts, radii, speeds, and rule weights grouped near the top of that file for quick tweaking.

## 🔧 Common tweaks

Open `script.js` and look for clearly grouped constants/arrays. Typical adjustments:

* **Particle count / species count** – increase for denser patterns (costs CPU).
* **Rule weights** – tune the attraction/repulsion matrix to discover new “life-like” behaviors.
* **Vision radius** – how far particles “feel” others.
* **Edge behavior** – toggle between wrap-around and wall bounce.
* **Time step & max speed** – stabilize or energize the motion.

> Tip: keep weights small at first, and change one species-pair at a time to see its effect.

## 🧪 Performance notes

* The simulation is **O(n²)** with naive all-pairs forces. Keep particle counts modest on mobile.
* Consider simple optimizations if you scale up:

  * **Spatial hashing / grid binning** to limit neighbor checks
  * **RequestAnimationFrame** cadence control
  * **OffscreenCanvas** or throttled rendering on low-end devices

## 🤝 Contributing

PRs welcome! Please keep changes focused and well-commented. If you add toggles/UI or new rule sets, drop a short note in this README.