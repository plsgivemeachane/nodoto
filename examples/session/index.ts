import { HTTPServer, Route, RequestType } from '../../httpServer';
import { SessionManager } from '../../httpServer/session/SessionManager';
import express from 'express';
import { logger } from '../../utils/winston';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// Initialize session manager
const sessionMiddleware = SessionManager.getInstance().init({
    secret: 'my-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true in production with HTTPS
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: 'lax'
    }
});

// We need to apply session middleware at the Express level
// before our routes. Access the express app via HTTPServer internals.
// In this example, we'll use the session within route handlers.

// GET / — check session
const checkSessionRoute = new Route('/', RequestType.GET)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        const session = (expressReq as any).session;
        return res.send({
            loggedIn: session?.userId ? true : false,
            userId: session?.userId || null,
            message: session?.userId ? 'You are logged in' : 'You are not logged in. POST /login to log in.'
        });
    });

// POST /login — set session
const loginRoute = new Route('/login', RequestType.POST)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        const body = expressReq.body;
        const session = (expressReq as any).session;

        // Demo: accept any username/password
        if (!body.username || !body.password) {
            return res.json({ error: 'Username and password required' }, 400);
        }

        session.userId = body.username;
        session.role = 'user';
        logger.info(`[Example] User logged in: ${body.username}`);
        return res.send({
            message: 'Logged in successfully',
            user: { username: body.username }
        });
    });

// POST /logout — destroy session
const logoutRoute = new Route('/logout', RequestType.POST)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        const session = (expressReq as any).session;
        session?.destroy((err: any) => {
            if (err) {
                logger.error(`[Example] Session destroy error: ${err.message}`);
            }
        });
        return res.send({ message: 'Logged out successfully' });
    });

// GET /profile — protected route (requires session)
const profileRoute = new Route('/profile', RequestType.GET)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        const session = (expressReq as any).session;
        if (!session?.userId) {
            return res.json({ error: 'Unauthorized. Please login first.' }, 401);
        }
        return res.send({
            profile: {
                username: session.userId,
                role: session.role
            }
        });
    });

server.addRoute(checkSessionRoute);
server.addRoute(loginRoute);
server.addRoute(logoutRoute);
server.addRoute(profileRoute);

// Note: For sessions to work, you need to apply the session middleware
// to the Express app. This requires modifying HTTPServer.start() to accept
// pre-start middleware, or applying it manually.
// For now, this example shows the SessionManager API usage.

server.start();
