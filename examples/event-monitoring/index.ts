import { HTTPServer, Route, RequestType } from '../../httpServer';
import Middlewares from '../../httpServer/routing/Middleware';
import EventManager from '../../httpServer/monitoring/EventManager';
import { RequestEvent } from '../../httpServer/monitoring/RequestEvent';
import { logger } from '../../utils/winston';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// Register a custom event listener that logs all request lifecycle events
const eventManager = EventManager.getInstance();

// Listen to request start events
eventManager.registerListener('request:start', (event: RequestEvent) => {
    logger.verbose(`[Event] Request started: ${event.request.ID} at ${event.timestamp}`);
});

// Listen to request end events
eventManager.registerListener('request:end', (event: RequestEvent) => {
    logger.verbose(`[Event] Request ended: ${event.request.ID}, duration: ${event.data?.totalTime}ms`);
});

// Listen to response close events
eventManager.registerListener('response:close', (event: RequestEvent) => {
    logger.verbose(`[Event] Response closed: ${event.request.ID}`);
});

// Listen to error events
eventManager.registerListener('request:error', (event: RequestEvent) => {
    logger.error(`[Event] Request error: ${event.request.ID}`);
});

eventManager.registerListener('response:error', (event: RequestEvent) => {
    logger.error(`[Event] Response error: ${event.request.ID}`);
});

// GET / — simple route with timeout middleware
const rootRoute = new Route('/', RequestType.GET)
    .route(Middlewares.timeout())
    .route(async (req, res) => {
        logger.info(`[Example] Processing request ${req.ID}`);
        return res.send({
            message: 'Check the server logs to see event lifecycle',
            requestId: req.ID
        });
    });

// GET /slow — slow route to see timing events
const slowRoute = new Route('/slow', RequestType.GET)
    .route(Middlewares.timeout())
    .route(async (req, res) => {
        logger.info(`[Example] Slow request started: ${req.ID}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return res.send({
            message: 'Slow request completed',
            requestId: req.ID
        });
    });

server.addRoute(rootRoute);
server.addRoute(slowRoute);

logger.info('[Example] Event monitoring example running. Watch logs for request lifecycle events.');
server.start();
