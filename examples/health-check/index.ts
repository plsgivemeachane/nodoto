import { HTTPServer } from '../../';
import os from 'os';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'info',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

const startTime = Date.now();

// GET /health — basic health check
const healthRoute = new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            status: 'healthy',
            uptime: Math.floor((Date.now() - startTime) / 1000),
            timestamp: Date.now()
        });
    });

// GET /health/detailed — detailed system metrics
const detailedHealthRoute = new HTTPServer.Route('/health/detailed', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const memUsage = process.memoryUsage();
        const cpus = os.cpus();

        return res.send({
            status: 'healthy',
            uptime: Math.floor((Date.now() - startTime) / 1000),
            timestamp: Date.now(),
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                arch: process.arch,
                hostname: os.hostname(),
                cpuCount: cpus.length,
                cpuModel: cpus[0]?.model || 'unknown',
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                loadAverage: os.loadavg()
            },
            process: {
                pid: process.pid,
                memory: {
                    rss: memUsage.rss,
                    heapTotal: memUsage.heapTotal,
                    heapUsed: memUsage.heapUsed,
                    external: memUsage.external
                }
            }
        });
    });

// GET /health/ready — readiness check
const readinessRoute = new HTTPServer.Route('/health/ready', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        // In a real app, check database connections, external services, etc.
        const checks = {
            server: true,
            memory: os.freemem() > 100 * 1024 * 1024, // At least 100MB free
            uptime: (Date.now() - startTime) > 1000 // Running for at least 1 second
        };

        const allHealthy = Object.values(checks).every(v => v === true);
        return res.send({
            ready: allHealthy,
            checks
        }, allHealthy ? 200 : 503);
    });

server.addRoute(healthRoute);
server.addRoute(detailedHealthRoute);
server.addRoute(readinessRoute);
server.start();
