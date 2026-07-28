const { parentPort, workerData } = require('worker_threads');

// CPU-bound task: sum all numbers up to `iterations`
const iterations = workerData.iterations || 1000000;
let sum = 0;

for (let i = 0; i < iterations; i++) {
    sum += i;
}

if (parentPort) {
    parentPort.postMessage({ sum, iterations });
}
