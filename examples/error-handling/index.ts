import { HTTPServer } from '../../';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// GET / — normal response
const helloRoute = new HTTPServer.Route('/', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({ message: 'Hello! Try the error endpoints.' });
    });

// GET /error/validation — 400
const validationErrorRoute = new HTTPServer.Route('/error/validation', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.ValidationError('Username is required');
    });

// GET /error/unauthorized — 401
const unauthorizedRoute = new HTTPServer.Route('/error/unauthorized', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.UnauthorizedError('You must log in first');
    });

// GET /error/forbidden — 403
const forbiddenRoute = new HTTPServer.Route('/error/forbidden', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.ForbiddenError('You do not have access to this resource');
    });

// GET /error/notfound — 404
const notFoundRoute = new HTTPServer.Route('/error/notfound', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.NotFoundError('User not found');
    });

// GET /error/conflict — 409
const conflictRoute = new HTTPServer.Route('/error/conflict', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.ConflictError('Email already registered');
    });

// GET /error/ratelimit — 429
const rateLimitRoute = new HTTPServer.Route('/error/ratelimit', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.RateLimitError('Too many requests, slow down');
    });

// GET /error/internal — 500 (unexpected error)
const internalErrorRoute = new HTTPServer.Route('/error/internal', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new Error('Something went horribly wrong');
    });

// GET /error/custom — custom HTTPServer.AppError
const customErrorRoute = new HTTPServer.Route('/error/custom', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        throw new HTTPServer.AppError('Payment required', 402);
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

// Note: In a real app, you'd wrap route handlers with HTTPServer.ErrorHandler.
// This example shows how to throw each error type.
// HTTPServer.ErrorHandler.handle(error, nres) can be called in catch blocks.

server.start();
