import { HTTPServer, Route, RequestType } from '../../httpServer';
import { RateLimiter } from '../../httpServer/middleware/RateLimiter';
import { Validator } from '../../httpServer/validation/Validator';
import { RateLimitError } from '../../httpServer/errors/AppError';
import Joi from 'joi';
import { logger } from '../../utils/winston';

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
const strictRoute = new Route('/strict', RequestType.GET)
    .route(RateLimiter.create({ windowMs: 60000, max: 5, message: 'Strict limit: 5 requests per minute' }))
    .route(async (req, res) => {
        return res.send({ message: 'You accessed the strict endpoint', limit: '5/min' });
    });

// Normal limit: 100 requests per minute
const normalRoute = new Route('/normal', RequestType.GET)
    .route(RateLimiter.create({ windowMs: 60000, max: 100 }))
    .route(async (req, res) => {
        return res.send({ message: 'You accessed the normal endpoint', limit: '100/min' });
    });

// Login endpoint: 10 attempts per 15 minutes
const loginRoute = new Route('/login', RequestType.POST)
    .route(RateLimiter.create({ windowMs: 15 * 60000, max: 10, message: 'Too many login attempts' }))
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        return res.send({ message: 'Login endpoint (rate limited)', limit: '10/15min' });
    });

const health = new Route('/health', RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy' });
    });

server.addRoute(health);
server.addRoute(strictRoute);
server.addRoute(normalRoute);
server.addRoute(loginRoute);

logger.info('[Template] Rate Limited Server running on port 3000');
server.start();
