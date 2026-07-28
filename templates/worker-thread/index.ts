import { HTTPServer, Route, RequestType } from '../../httpServer';
import { ThreadPool } from '../../httpServer/threading/ThreadPool';
import { Validator } from '../../httpServer/validation/Validator';
import Joi from 'joi';
import { logger } from '../../utils/winston';

// === WORKER THREAD SERVER TEMPLATE ===
// Offloads CPU-bound tasks to worker threads.

HTTPServer.init({
    port: 3000,
    timeout: 30000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();
const pool = ThreadPool.getInstance(4);

// POST /compute — run a CPU-bound task in a worker thread
const computeRoute = new Route('/compute', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            iterations: Joi.number().integer().min(1).max(100000000).default(1000000)
        })
    }))
    .route(async (req, res) => {
        const iterations = req.getRequest().body.iterations;

        const result = await pool.runTask(__dirname + '/worker.js', { iterations }, { timeout: 20000 });

        if (!result.success) {
            return res.json({ error: 'Computation failed', detail: result.error }, 500);
        }

        return res.send({
            message: 'Computation complete',
            iterations,
            result: result.data,
            activeWorkers: pool.getActiveWorkerCount()
        });
    });

// GET /workers — check thread pool status
const workersStatusRoute = new Route('/workers', RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            maxWorkers: pool.getMaxWorkers(),
            activeWorkers: pool.getActiveWorkerCount()
        });
    });

const health = new Route('/health', RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            status: 'healthy',
            threadPool: {
                max: pool.getMaxWorkers(),
                active: pool.getActiveWorkerCount()
            }
        });
    });

server.addRoute(health);
server.addRoute(computeRoute);
server.addRoute(workersStatusRoute);

logger.info('[Template] Worker Thread Server running on port 3000');
server.start();
