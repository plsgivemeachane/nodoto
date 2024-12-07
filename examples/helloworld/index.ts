import { HTTPServer } from '../../httpServer/HTTPServer';
import { RequestType } from '../../httpServer/request/RequestType';
import Route from '../../httpServer/routing/Route';
import Utils from '../../utils/utils';
import { logger } from '../../utils/winston';
// Initialize HTTP server
HTTPServer.init({
    port: 3000,
    timeout: 2000, // 5 seconds timeout
    logLevel: 'debug',
    corsSetting: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    }
});
const server = HTTPServer.getInstance();

// Create a simple Hello World route
const helloRoute = new Route('/', RequestType.GET)
.route(async (req, res) => {
    await Utils.sleep(1000); // Simulate some work
    return res.send({
        message: 'Hello, World! Welcome to nodoto server.',
        timestamp: Date.now()
    });
});

// Add route to server
server.addRoute(helloRoute);

// Start the server
server.start()