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