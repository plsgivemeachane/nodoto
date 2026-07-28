import { HTTPServer } from '../../';
import type { User } from '../../httpServer/auth/rbac/types';
import Joi from 'joi';

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
const registerRoute = new HTTPServer.Route('/register', HTTPServer.RequestType.POST)
    .route(HTTPServer.Validator.validate({
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
            throw new HTTPServer.ConflictError('Username already taken');
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
        HTTPServer.Logger.info(`[Example] User registered: ${body.username} (${body.role})`);

        return res.send({
            message: 'User registered successfully',
            user: { id: userId, username: body.username, roles: user.roles }
        });
    });

// POST /login — login and set user context
const loginRoute = new HTTPServer.Route('/login', HTTPServer.RequestType.POST)
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const user = users.get(body.username);

        if (!user || user.password !== body.password) {
            throw new HTTPServer.UnauthorizedError('Invalid username or password');
        }

        // Set user in request context (in production: generate JWT token)
        const userContext: User = {
            id: user.id,
            username: user.username,
            roles: user.roles
        };
        req.setUser(userContext);

        HTTPServer.Logger.info(`[Example] User logged in: ${user.username}`);
        return res.send({
            message: 'Login successful',
            user: { id: user.id, username: user.username, roles: user.roles }
        });
    });

// GET /me — get current user (requires auth)
const meRoute = new HTTPServer.Route('/me', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.auth)
    .route(async (req, res) => {
        const user = req.getUser();
        if (!user) {
            throw new HTTPServer.UnauthorizedError('Not authenticated');
        }
        return res.send({ user });
    });

// --- Protected Resource Routes ---

// GET /posts — requires auth + read permission
const postsRoute = new HTTPServer.Route('/posts', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('read', 'posts'))
    .route(async (req, res) => {
        return res.send({
            posts: [
                { id: 1, title: 'Hello World', author: 'admin' },
                { id: 2, title: 'RBAC Example', author: 'editor' }
            ]
        });
    });

// POST /posts — requires auth + create permission
const createPostRoute = new HTTPServer.Route('/posts', HTTPServer.RequestType.POST)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('create', 'posts'))
    .route(HTTPServer.Validator.validate({
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
const deletePostRoute = new HTTPServer.Route('/posts/:id', HTTPServer.RequestType.DELETE)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('delete', 'posts'))
    .route(async (req, res) => {
        const id = req.getRequest().params.id;
        return res.send({ message: `Post ${id} deleted` });
    });

// GET /roles — list all available roles (admin only)
const rolesRoute = new HTTPServer.Route('/roles', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.auth)
    .route(async (req, res) => {
        // Demonstrate checking RBAC manager directly
        const rbac = HTTPServer.RBAC.getInstance();
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

HTTPServer.Logger.info('[Example] Full user pipeline example running on port 3000');
HTTPServer.Logger.info('[Example] Try: POST /register -> POST /login -> GET /me -> GET /posts');
server.start();
