import { HTTPServer, Route, RequestType } from '../../httpServer';
import {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError
} from '../../httpServer/errors/AppError';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// GET / — normal response
const helloRoute = new Route('/', RequestType.GET)
    .route(async (req, res) => {
        return res.send({ message: 'Hello! Try the error endpoints.' });
    });

// GET /error/validation — 400
const validationErrorRoute = new Route('/error/validation', RequestType.GET)
    .route(async (req, res) => {
        throw new ValidationError('Username is required');
    });

// GET /error/unauthorized — 401
const unauthorizedRoute = new Route('/error/unauthorized', RequestType.GET)
    .route(async (req, res) => {
        throw new UnauthorizedError('You must log in first');
    });

// GET /error/forbidden — 403
const forbiddenRoute = new Route('/error/forbidden', RequestType.GET)
    .route(async (req, res) => {
        throw new ForbiddenError('You do not have access to this resource');
    });

// GET /error/notfound — 404
const notFoundRoute = new Route('/error/notfound', RequestType.GET)
    .route(async (req, res) => {
        throw new NotFoundError('User not found');
    });

// GET /error/conflict — 409
const conflictRoute = new Route('/error/conflict', RequestType.GET)
    .route(async (req, res) => {
        throw new ConflictError('Email already registered');
    });

// GET /error/ratelimit — 429
const rateLimitRoute = new Route('/error/ratelimit', RequestType.GET)
    .route(async (req, res) => {
        throw new RateLimitError('Too many requests, slow down');
    });

// GET /error/internal — 500 (unexpected error)
const internalErrorRoute = new Route('/error/internal', RequestType.GET)
    .route(async (req, res) => {
        throw new Error('Something went horribly wrong');
    });

// GET /error/custom — custom AppError
const customErrorRoute = new Route('/error/custom', RequestType.GET)
    .route(async (req, res) => {
        throw new AppError('Payment required', 402);
    });

server.addRoute(helloRoute);
server.addRoute(validationErrorRoute);
server.addRoute(unauthorizedRoute);
server.addRoute(forbiddenRoute);
server.addRoute(notFoundRoute);
server.addRoute(conflictRoute);
server.addRoute(rateLimitRoute);
server.addRoute(internalErrorRoute);
server.addRoute(customErrorRoute);

// Note: In a real app, you'd wrap route handlers with ErrorHandler.
// This example shows how to throw each error type.
// ErrorHandler.handle(error, nres) can be called in catch blocks.

server.start();
