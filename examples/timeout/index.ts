import { HTTPServer } from '../../';

// Initialize server with short timeout to demonstrate
HTTPServer.init({
    port: 3000,
    timeout: 3000, // 3 second timeout
    logLevel: 'debug'
});
const server = HTTPServer.getInstance();

// GET /fast — responds immediately
const fastRoute = new HTTPServer.Route('/fast', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.timeout())
    .route(async (req, res) => {
        return res.send({ message: 'Fast response!', timestamp: Date.now() });
    });

// GET /slow — takes 5 seconds, will be killed by timeout (3s)
const slowRoute = new HTTPServer.Route('/slow', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.timeout())
    .route(async (req, res) => {
        HTTPServer.Logger.info('[Example] Processing slow request, will timeout...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return res.send({ message: 'This should never be reached' });
    });

// GET /medium — takes 2 seconds, just under the timeout
const mediumRoute = new HTTPServer.Route('/medium', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.timeout())
    .route(async (req, res) => {
        HTTPServer.Logger.info('[Example] Processing medium request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return res.send({ message: 'Medium response, just in time!' });
    });

server.addRoute(fastRoute);
server.addRoute(slowRoute);
server.addRoute(mediumRoute);
server.start();
