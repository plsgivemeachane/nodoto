import { HTTPServer, Route, RequestType } from '../../httpServer';
import Middlewares from '../../httpServer/routing/Middleware';
import { checkPermission } from '../../httpServer/auth/rbac/middleware';
import { User } from '../../httpServer/auth/rbac/types';
import { RBACManager } from '../../httpServer/auth/rbac/RBACManager';
import { Validator } from '../../httpServer/validation/Validator';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../httpServer/errors/AppError';
import Joi from 'joi';
import { logger } from '../../utils/winston';

// In-memory user store (in production, use a database)
const users: Map<string, { id: string; username: string; password: string; roles: string[] }> = new Map();

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// --- Auth Routes ---

// POST /register — register a new user
const registerRoute = new Route('/register', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer')
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;

        // Check if user exists
        if (users.has(body.username)) {
            throw new ConflictError('Username already taken');
        }

        // Create user
        const userId = Date.now().toString();
        const user = {
            id: userId,
            username: body.username,
            password: body.password, // In production: hash with bcrypt!
            roles: [body.role]
        };
        users.set(body.username, user);
        logger.info(`[Example] User registered: ${body.username} (${body.role})`);

        return res.send({
            message: 'User registered successfully',
            user: { id: userId, username: body.username, roles: user.roles }
        });
    });

// POST /login — login and set user context
const loginRoute = new Route('/login', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const user = users.get(body.username);

        if (!user || user.password !== body.password) {
            throw new UnauthorizedError('Invalid username or password');
        }

        // Set user in request context (in production: generate JWT token)
        const userContext: User = {
            id: user.id,
            username: user.username,
            roles: user.roles
        };
        req.setUser(userContext);

        logger.info(`[Example] User logged in: ${user.username}`);
        return res.send({
            message: 'Login successful',
            user: { id: user.id, username: user.username, roles: user.roles }
        });
    });

// GET /me — get current user (requires auth)
const meRoute = new Route('/me', RequestType.GET)
    .route(Middlewares.auth)
    .route(async (req, res) => {
        const user = req.getUser();
        if (!user) {
            throw new UnauthorizedError('Not authenticated');
        }
        return res.send({ user });
    });

// --- Protected Resource Routes ---

// GET /posts — requires auth + read permission
const postsRoute = new Route('/posts', RequestType.GET)
    .route(Middlewares.auth)
    .route(checkPermission('read', 'posts'))
    .route(async (req, res) => {
        return res.send({
            posts: [
                { id: 1, title: 'Hello World', author: 'admin' },
                { id: 2, title: 'RBAC Example', author: 'editor' }
            ]
        });
    });

// POST /posts — requires auth + create permission
const createPostRoute = new Route('/posts', RequestType.POST)
    .route(Middlewares.auth)
    .route(checkPermission('create', 'posts'))
    .route(Validator.validate({
        body: Joi.object({
            title: Joi.string().min(1).max(200).required(),
            content: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        const user = req.getUser();
        const body = req.getRequest().body;
        return res.send({
            message: 'Post created',
            post: { id: Date.now(), title: body.title, author: user?.username }
        });
    });

// DELETE /posts/:id — requires auth + delete permission (admin only by default)
const deletePostRoute = new Route('/posts/:id', RequestType.DELETE)
    .route(Middlewares.auth)
    .route(checkPermission('delete', 'posts'))
    .route(async (req, res) => {
        const id = req.getRequest().params.id;
        return res.send({ message: `Post ${id} deleted` });
    });

// GET /roles — list all available roles (admin only)
const rolesRoute = new Route('/roles', RequestType.GET)
    .route(Middlewares.auth)
    .route(async (req, res) => {
        // Demonstrate checking RBAC manager directly
        const rbac = RBACManager.getInstance();
        const user = req.getUser()!;
        const isAdmin = rbac.can(user, 'read', 'users');

        if (!isAdmin) {
            return res.json({ error: 'Only admins can view roles' }, 403);
        }

        return res.send({
            roles: ['admin', 'editor', 'viewer', 'moderator'],
            currentUser: user.username,
            currentRoles: user.roles
        });
    });

server.addRoute(registerRoute);
server.addRoute(loginRoute);
server.addRoute(meRoute);
server.addRoute(postsRoute);
server.addRoute(createPostRoute);
server.addRoute(deletePostRoute);
server.addRoute(rolesRoute);

logger.info('[Example] Full user pipeline example running on port 3000');
logger.info('[Example] Try: POST /register -> POST /login -> GET /me -> GET /posts');
server.start();
