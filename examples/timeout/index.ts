import { HTTPServer, Route, RequestType } from '../../httpServer';
import Middlewares from '../../httpServer/routing/Middleware';
import { logger } from '../../utils/winston';

// Initialize server with short timeout to demonstrate
HTTPServer.init({
    port: 3000,
    timeout: 3000, // 3 second timeout
    logLevel: 'debug'
});
const server = HTTPServer.getInstance();

// GET /fast — responds immediately
const fastRoute = new Route('/fast', RequestType.GET)
    .route(Middlewares.timeout())
    .route(async (req, res) => {
        return res.send({ message: 'Fast response!', timestamp: Date.now() });
    });

// GET /slow — takes 5 seconds, will be killed by timeout (3s)
const slowRoute = new Route('/slow', RequestType.GET)
    .route(Middlewares.timeout())
    .route(async (req, res) => {
        logger.info('[Example] Processing slow request, will timeout...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return res.send({ message: 'This should never be reached' });
    });

// GET /medium — takes 2 seconds, just under the timeout
const mediumRoute = new Route('/medium', RequestType.GET)
    .route(Middlewares.timeout())
    .route(async (req, res) => {
        logger.info('[Example] Processing medium request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return res.send({ message: 'Medium response, just in time!' });
    });

server.addRoute(fastRoute);
server.addRoute(slowRoute);
server.addRoute(mediumRoute);
server.start();
