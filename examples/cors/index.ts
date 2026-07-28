import { HTTPServer } from '../../';

// Initialize server with CORS enabled
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    useUrlParser: true,
    corsSetting: {
        origin: '*', // Allow all origins (use specific origins in production)
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
});
const server = HTTPServer.getInstance();

// Root route
const rootRoute = new HTTPServer.Route('/', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            message: 'CORS is enabled on this server',
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
            }
        });
    });

// API v1 route group
const apiV1 = new HTTPServer.RouteGroup('/api/v1');
apiV1.route(
    new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
        .route(async (req, res) => {
            return res.send({ status: 'healthy', version: 'v1' });
        }),
    new HTTPServer.Route('/info', HTTPServer.RequestType.GET)
        .route(async (req, res) => {
            return res.send({ name: 'nodoto-cors-example', version: '1.0.0' });
        })
);

// API v2 route group (nested)
const apiV2 = new HTTPServer.RouteGroup('/api/v2');
apiV2.route(
    new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
        .route(async (req, res) => {
            return res.send({ status: 'healthy', version: 'v2' });
        }),
    new HTTPServer.Route('/users', HTTPServer.RequestType.GET)
        .route(async (req, res) => {
            return res.send({
                users: [
                    { id: 1, name: 'Alice' },
                    { id: 2, name: 'Bob' }
                ]
            });
        })
);

server.addRoute(rootRoute);
server.addRoute(apiV1);
server.addRoute(apiV2);
server.start();
