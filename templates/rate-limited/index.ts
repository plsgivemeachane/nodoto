import { HTTPServer } from '../../';
import Joi from 'joi';

// === RATE LIMITED SERVER TEMPLATE ===
// Different rate limits for different endpoints.

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// Strict limit: 5 requests per minute
const strictRoute = new HTTPServer.Route('/strict', HTTPServer.RequestType.GET)
    .route(HTTPServer.RateLimiter.create({ windowMs: 60000, max: 5, message: 'Strict limit: 5 requests per minute' }))
    .route(async (req, res) => {
        return res.send({ message: 'You accessed the strict endpoint', limit: '5/min' });
    });

// Normal limit: 100 requests per minute
const normalRoute = new HTTPServer.Route('/normal', HTTPServer.RequestType.GET)
    .route(HTTPServer.RateLimiter.create({ windowMs: 60000, max: 100 }))
    .route(async (req, res) => {
        return res.send({ message: 'You accessed the normal endpoint', limit: '100/min' });
    });

// Login endpoint: 10 attempts per 15 minutes
const loginRoute = new HTTPServer.Route('/login', HTTPServer.RequestType.POST)
    .route(HTTPServer.RateLimiter.create({ windowMs: 15 * 60000, max: 10, message: 'Too many login attempts' }))
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        return res.send({ message: 'Login endpoint (rate limited)', limit: '10/15min' });
    });

const health = new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy' });
    });

server.addRoute(health);
server.addRoute(strictRoute);
server.addRoute(normalRoute);
server.addRoute(loginRoute);

HTTPServer.Logger.info('[Template] Rate Limited Server running on port 3000');
server.start();
