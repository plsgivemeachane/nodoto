import { HTTPServer } from '../../httpServer/HTTPServer';
import { RequestType } from '../../httpServer/request/RequestType';
import Middlewares from '../../httpServer/routing/Middleware';
import Route from '../../httpServer/routing/Route';
import Utils from '../../utils/utils';
import { logger } from '../../utils/winston';

// Initialize utils
Utils.init();

// Initialize HTTP server
HTTPServer.init({
    port: 3000,
    timeout: 5000, // 5 seconds timeout
    // cors: {
    //     enabled: true,
    //     origin: '*'
    // },
    logLevel: 'debug'
});
const server = HTTPServer.getInstance();

// Create a simple Hello World route
const helloRoute = new Route('/', RequestType.GET)
.route(Middlewares.timeout())
//TODO: Stop processing request after timed out --> Provide a way to stop processing, or inject the response .json, send, status object by wrapped it with custom response
.route(async (req, res) => {
    try {
        logger.info('[Example] Processing request with 10 second delay');
        await Utils.sleep(1000); // Simulate some work
        res.send({
            message: 'Hello, World! Welcome to nodoto server.',
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('[Example] Error processing request:', error);
        res.send({ error: 'Internal Server Error' });
    }
    return true; // Must return true to continue the chain
});

// Add route to server
server.addRoute(helloRoute);

// Start the server
server.start()