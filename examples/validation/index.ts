import { HTTPServer, Route, RequestType } from '../../httpServer';
import { Validator } from '../../httpServer/validation/Validator';
import Joi from 'joi';
import { logger } from '../../utils/winston';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// POST /users — validate body with Joi
const createUserRoute = new Route('/users', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            email: Joi.string().email().required(),
            age: Joi.number().integer().min(0).max(120)
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        logger.info(`[Example] Creating user: ${body.username}`);
        return res.send({
            message: 'User created',
            user: { id: Date.now(), username: body.username, email: body.email }
        });
    });

// GET /search — validate query params
const searchRoute = new Route('/search', RequestType.GET)
    .route(Validator.validate({
        query: Joi.object({
            q: Joi.string().min(1).required(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10)
        })
    }))
    .route(async (req, res) => {
        const query = req.getRequest().query;
        return res.send({
            query: query.q,
            page: query.page,
            limit: query.limit,
            results: []
        });
    });

server.addRoute(createUserRoute);
server.addRoute(searchRoute);
server.start();
