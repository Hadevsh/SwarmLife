const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Particle count
const numParticles = 1000;
const numColors = 6;

// Interaction strengths: matrix[colorA][colorB] gives a value in [-1,1]
// Positive -> attraction, Negative -> repulsion
const attractionMatrix = createRandomMatrix();

// Friction is modelled as a decay with specified half-life
// Time for velocity to decay by half
const frictionHalfTime = 0.040; // tHalf >= 0

const deltaTime = 0.02; // Discrete time step, in seconds (time step)
const maxRadius = 0.1; // Max radius of interaction, rMax > 0

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
    const beta = 0.3;
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

// Update all particles: compute forces, update velocities & positions
function updateParticles() {
    // Compute velocity updates based on all pairwise interactions
    for (let i = 0; i < numParticles; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        for (let j = 0; j < numParticles; j++) {
            if (j === i) continue; // Skip itself

            // Vector from i to j
            const dx = posX[j] - posX[i];
            const dy = posY[j] - posY[i];
            const dist = Math.hypot(dx, dy);

            // Only interact if within maxRadius
            if (dist > 0 && dist < maxRadius) {
                // Normalize distance to [0, 1]
                const r_norm = dist / maxRadius;

                // Look up attraction coefficient by color pair
                const a = attractionMatrix[colors[i]][colors[j]];

                // Compute scalar force magnitude via piecewise law
                const f = attractionForce(r_norm, a); // Normalize the distance

                // Add vector contribution (unit direction * magnitude)
                totalForceX += dx / dist * f;
                totalForceY += dy / dist * f;
            }
        }

        // Scale by maxRadius to keep units consistent
        totalForceX *= maxRadius;
        totalForceY *= maxRadius;

        // Apply friction (velocity decay)
        velX[i] *= frictionFactor;
        velY[i] *= frictionFactor;

        // Euler integration: v = v + F*dt
        velX[i] += totalForceX * deltaTime;
        velY[i] += totalForceY * deltaTime;
    }

    // Update positions
    for (let i = 0; i < numParticles; i++) {
        // Euler integration: x = x + v*dt
        posX[i] += velX[i] * deltaTime;
        posY[i] += velY[i] * deltaTime;
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
    return `hsl(${360 * (idx / numColors)},100%,50%)`;
}

function valueColor(v) {
    const mag = Math.min(Math.abs(v), 1);
    if (v >= 0) {
        // green ramp: white → green
        return `rgba(${255 - 255*mag},${255},${255 - 255*mag},1)`;
    } else {
        // red ramp: white → red
        return `rgba(${255},${255 - 255*mag},${255 - 255*mag},1)`;
    }
}

function renderMatrix() {
    const N = numColors + 1;
    container.style.gridTemplateColumns = `repeat(${N}, auto)`;
    container.style.gridTemplateRows    = `repeat(${N}, auto)`;
    container.innerHTML = '';

    // 1) Top-left placeholder
    container.appendChild(document.createElement('div'));

    // 2) Top header (color circles)
    for (let j = 0; j < numColors; j++) {
        const div = document.createElement('div');
        div.classList.add('cell','header-cell');
        div.style.background = particleHue(j);
        div.title = `Color ${j}`;
        container.appendChild(div);
    }

    // 3) Rows: each starts with a header circle, then data squares
    for (let i = 0; i < numColors; i++) {
        // 3a) Row-header circle
        const hdr = document.createElement('div');
        hdr.classList.add('cell','header-cell');
        hdr.style.background = particleHue(i);
        hdr.title = `Color ${i}`;
        container.appendChild(hdr);

        // 3b) Data cells
        for (let j = 0; j < numColors; j++) {
        const v = attractionMatrix[i][j];
        const cell = document.createElement('div');
        cell.classList.add('cell','data-cell');
        cell.style.background = valueColor(v);
        cell.title = v.toFixed(2);
        container.appendChild(cell);
        }
    }
}

// Render once the DOM is ready
document.addEventListener('DOMContentLoaded', renderMatrix);
