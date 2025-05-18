const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Particle count
const numParticles = 2000;
const numColors = 6;

// Interaction strengths: matrix[colorA][colorB] gives a value in [-1,1]
// Positive -> attraction, Negative -> repulsion
let attractionMatrix = createRandomMatrix();

// Friction is modelled as a decay with specified half-life
// Time for velocity to decay by half
const frictionHalfTime = 0.040; // tHalf >= 0

const deltaTime = 0.01; // Discrete time step, in seconds (time step)
const maxRadius = 0.1; // Max radius of interaction, rMax > 0

// Spatial‐hash grid settings
const cellSize = maxRadius;
const gridCols = Math.ceil(1 / cellSize);
const gridRows = gridCols;  // domain is [0,1]×[0,1]
const grid = new Array(gridCols * gridRows);

// Velocities are multiplied by this factor each update to simulate damping
const frictionFactor = Math.pow(0.5, deltaTime / frictionHalfTime)

function createRandomMatrix() {
    const rows = [];
    for (let i = 0; i < numColors; i++) {
        const row = [];
        for (let j = 0; j < numColors; j++) {
            row.push(Math.random() * 2 - 1); // Random value between [-1; 1]
        }
        rows.push(row);
    }
    return rows;
}

// Paricle states data
// We use typed arrays for performance
const colors = new Int32Array(numParticles);
const posX = new Float32Array(numParticles);
const posY = new Float32Array(numParticles);
const velX = new Float32Array(numParticles);
const velY = new Float32Array(numParticles);

// Initialize each particle with random position, zero velocity, random color
for (let i = 0; i < numParticles; i++) {
    colors[i] = Math.floor(Math.random() * numColors);
    posX[i] = Math.random();
    posY[i] = Math.random();
    velX[i] = 0;
    velY[i] = 0;
}

function attractionForce(r_norm, attraction) {
    /*
    Computes the pairwise force magnitude based on normalized distance and 
    the attraction coefficient.
    We use a piecewise function:
    Let r_norm = distance / maxRadius (so r_norm in [0..∞])
    Beta = 0.3 defines a short-range repulsion zone (r_norm < Beta)
        => force = (r_norm / Beta) - 1  (ranges from -1 at r_norm=0 to 0 at r_norm=Beta)
    For Beta <= r_norm <= 1: a smooth attraction/repulsion scaled by "attraction"
        => force = attraction * (1 - |2*r_norm - 1 - Beta|/(1 - Beta))
    Outside r_norm>1: no interaction
    */
    const beta = 0.4;
    if (r_norm < beta) {
        // Strong short-range repulsion to avoid overlaps
        return r_norm / beta - 1;
    } else if (beta < r_norm && r_norm < 1) {
        // Attraction or mild repulsion, depending on matrix value
        return attraction * (1 - Math.abs(2 * r_norm - 1 - beta) / (1 - beta));
    } else {
        // No force beyond maxRadius
        return 0;
    }
}

// Build spatial‐hash: clear & bucket every step
function buildGrid() {
    for (let i = 0; i < grid.length; i++) {
        grid[i] = [];
    }
    for (let i = 0; i < numParticles; i++) {
        const cx = Math.floor(posX[i] / cellSize) % gridCols;
        const cy = Math.floor(posY[i] / cellSize) % gridRows;
        // normalize negative modulo
        const idx = ((cx + gridCols) % gridCols) + ((cy + gridRows) % gridRows)*gridCols;
        grid[idx].push(i);
    }
}

// Update all particles: compute forces, update velocities & positions
function updateParticles() {
    buildGrid();

    // Compute velocity updates based on all pairwise interactions
    for (let i = 0; i < numParticles; i++) {
        const xi = posX[i];
        const yi = posY[i];
        const ci = colors[i];
        let fx = 0; // Total force y
        let fy = 0; // Total force x

        // This particle's cell
        const cx = Math.floor(xi / cellSize);
        const cy = Math.floor(yi / cellSize);

        // Loop over 3×3 neighborhood with wrapping
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = (cx + dx + gridCols) % gridCols;
                const ny = (cy + dy + gridRows) % gridRows;
                const bucket = grid[nx + ny * gridCols];
                for (let k = 0; k < bucket.length; k++) {
                    const j = bucket[k];
                    if (j === i) continue;

                    // Compute periodic delta
                    let dx_ = posX[j] - xi;
                    let dy_ = posY[j] - yi;
                    if (dx_ >  0.5) dx_ -= 1;
                    if (dx_ < -0.5) dx_ += 1;
                    if (dy_ >  0.5) dy_ -= 1;
                    if (dy_ < -0.5) dy_ += 1;

                    const dist = Math.hypot(dx_, dy_);
                    if (dist > 0 && dist < maxRadius) {
                        const r_norm = dist / maxRadius;
                        const a = attractionMatrix[ci][colors[j]];
                        const f = attractionForce(r_norm, a);
                        fx += (dx_ / dist) * f;
                        fy += (dy_ / dist) * f;
                    }
                }
            }
        }

        // scale and integrate
        fx *= maxRadius;
        fy *= maxRadius;
        velX[i] = velX[i] * frictionFactor + fx * deltaTime;
        velY[i] = velY[i] * frictionFactor + fy * deltaTime;
    }

    // update positions with wrapping
    for (let i = 0; i < numParticles; i++) {
        posX[i] = (posX[i] + velX[i] * deltaTime + 1) % 1;
        posY[i] = (posY[i] + velY[i] * deltaTime + 1) % 1;
    }
}

// Update state and redraw
function loop() {
    updateParticles();

    // Clear canvas to black background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each particle as a small circle
    for (let i = 0; i < numParticles; i++) {
        // Scale each particle coordinates up to screen coordinates
        const x = posX[i] * canvas.width;
        const y = posY[i] * canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        // Color hue based on particle type (evenly spaced on color wheel)
        ctx.fillStyle = `hsl(${360 * (colors[i] / numColors)}, 100%, 50%)`;
        ctx.fill();
    }

    // Queue up next frame
    requestAnimationFrame(loop);
}

// Start the animation
requestAnimationFrame(loop);

// Interaction matrix display
const details = document.getElementById('matrix-details');
const container = document.getElementById('matrix-container');

function particleHue(idx) {
    return `hsl(${360 * (idx / numColors)}, 100%, 50%)`;
}

function valueColor(v) {
    const mag = Math.min(Math.abs(v), 1);
    if (v >= 0) {
        // green ramp: white → green
        return `rgba(${255 - 255*mag}, ${255}, ${255 - 255*mag}, 1)`;
    } else {
        // red ramp: white → red
        return `rgba(${255}, ${255 - 255*mag}, ${255 - 255*mag}, 1)`;
    }
}

function renderMatrix() {
    const N = numColors + 1;
    container.style.gridTemplateColumns = `repeat(${N}, auto)`;
    container.style.gridTemplateRows = `repeat(${N}, auto)`;
    container.innerHTML = '';

    container.appendChild(document.createElement('div'));

    for (let j = 0; j < numColors; j++) {
        const div = document.createElement('div');
        div.classList.add('cell', 'header-cell');
        div.style.background = particleHue(j);
        div.title = `Color ${j}`;
        container.appendChild(div);
    }

    for (let i = 0; i < numColors; i++) {
        const hdr = document.createElement('div');
        hdr.classList.add('cell', 'header-cell');
        hdr.style.background = particleHue(i);
        hdr.title = `Color ${i}`;
        container.appendChild(hdr);

        for (let j = 0; j < numColors; j++) {
            const v = attractionMatrix[i][j];
            const cell = document.createElement('div');
            cell.classList.add('cell', 'data-cell');
            cell.style.background = valueColor(v);
            cell.title = v.toFixed(2);
            container.appendChild(cell);
        }
    }
}

document.addEventListener('DOMContentLoaded', renderMatrix);

const copyMatrixButton = document.getElementById('copy-matrix');
copyMatrixButton.addEventListener("click", () => {
    navigator.clipboard.writeText(attractionMatrix);
});

const randomMatrixButton = document.getElementById('random-matrix');
randomMatrixButton.addEventListener("click", () => {
    attractionMatrix = createRandomMatrix();
    renderMatrix();
});