import { HTTPServer } from '../../';
import os from 'os';

// === MICROSERVICE STARTER TEMPLATE ===
// Minimal service with health check, logging, and error handling.

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'info',
    useJsonParser: true
});
const server = HTTPServer.getInstance();
const startTime = Date.now();

const health = new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            status: 'healthy',
            service: 'microservice-starter',
            uptime: Math.floor((Date.now() - startTime) / 1000),
            memory: `${Math.round(os.freemem() / 1024 / 1024)}MB free`,
            timestamp: Date.now()
        });
    });

const ready = new HTTPServer.Route('/ready', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({ ready: true, timestamp: Date.now() });
    });

const root = new HTTPServer.Route('/', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            service: 'microservice-starter',
            version: '1.0.0',
            endpoints: ['/health', '/ready']
        });
    });

server.addRoute(root);
server.addRoute(health);
server.addRoute(ready);
server.start();
