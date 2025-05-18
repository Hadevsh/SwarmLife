const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Particle count
const numParticles = 2000;
const numColors = 3;

// Forces
const attractionMatrix = createRandomMatrix();
const frictionHalfTime = 0.040; // tHalf >= 0

// Computation
const deltaTime = 0.02; // time step
const maxRadius = 0.1; // rMax > 0

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

// Paricle data
const colors = new Int32Array(numParticles);
const posX = new Int32Array(numParticles);
const posY = new Int32Array(numParticles);
const velX = new Int32Array(numParticles);
const velY = new Int32Array(numParticles);
for (let i = 0; i < numParticles; i++) {
    colors[i] = Math.floor(Math.random() * numColors);

    // Set random coordinates for each particle
    posX[i] = Math.random();
    posY[i] = Math.random();

    velX[i] = 0;
    velY[i] = 0;
}

function attractionForce(radius, attraction) {
    const beta = 0.3;
    if (radius < beta) {
        return radius / beta - 1;
    } else if (beta < radius && radius < 1) {
        return attraction * (1 - Math.abs(2 * radius - 1 - beta) / (1 - beta));
    } else {
        return 0;
    }
}

function updateParticles() {
    // Update velocites
    for (let i = 0; i < numParticles; i++) {
        let totalForceX = 0;
        let totalForceY = 0;

        for (let j = 0; j < numParticles; j++) {
            if (j === i) continue; // Skip itself
            const radiusX = posX[j] - posX[i];
            const radiusY = posY[j] - posY[i];
            const radius = Math.hypot(radiusX, radiusY);
            if (radius > 0 && radius < maxRadius) {
                const force = attractionForce(radius / maxRadius, attractionMatrix[colors[i]][colors[j]]); // Normalize the distance
                totalForceX += radiusX / radius * force;
                totalForceY += radiusY / radius * force;
            }
        }

        // Scale forces by max radius
        totalForceX *= maxRadius;
        totalForceY *= maxRadius;

        velX[i] *= frictionFactor;
        velY[i] *= frictionFactor;

        velX[i] += totalForceX * deltaTime;
        velY[i] += totalForceY * deltaTime;
    }
}

function loop() {
    // Update particles
    updateParticles();

    // Draw particles
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numParticles; i++) {
        ctx.beginPath();

        // Scale each particle coordinates up to screen coordinates
        const screenX = posX[i] * canvas.width;
        const screenY = posY[i] * canvas.height;

        ctx.arc(screenX, screenY, 1, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${360 * (colors[i] / numColors)}, 100%, 50%)` // Color based on number of different colored particles
        ctx.fill();
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);