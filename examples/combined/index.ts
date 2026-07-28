import { HTTPServer } from '../../';
import type { User } from '../../httpServer/auth/rbac/types';
import Joi from 'joi';
import os from 'os';

// In-memory data
const users: Map<string, { id: string; username: string; password: string; roles: string[] }> = new Map();
const posts: Map<number, { id: number; title: string; content: string; authorId: string }> = new Map();
let nextPostId = 1;
const startTime = Date.now();

// Initialize server with all features
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    useUrlParser: true,
    corsSetting: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
});
const server = HTTPServer.getInstance();

// ==========================================
// Health Check Routes
// ==========================================
const healthRoute = new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            status: 'healthy',
            uptime: Math.floor((Date.now() - startTime) / 1000),
            memory: `${Math.round(os.freemem() / 1024 / 1024)}MB free`
        });
    });

// ==========================================
// Auth Routes (public)
// ==========================================
const registerRoute = new HTTPServer.Route('/auth/register', HTTPServer.RequestType.POST)
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer')
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        if (users.has(body.username)) {
            throw new HTTPServer.ConflictError('Username already taken');
        }
        const userId = Date.now().toString();
        users.set(body.username, {
            id: userId,
            username: body.username,
            password: body.password,
            roles: [body.role]
        });
        HTTPServer.Logger.info(`[Example] User registered: ${body.username}`);
        return res.send({
            message: 'Registered successfully',
            user: { id: userId, username: body.username, roles: [body.role] }
        });
    });

const loginRoute = new HTTPServer.Route('/auth/login', HTTPServer.RequestType.POST)
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
            throw new HTTPServer.UnauthorizedError('Invalid credentials');
        }
        const userContext: User = {
            id: user.id,
            username: user.username,
            roles: user.roles
        };
        req.setUser(userContext);
        return res.send({
            message: 'Login successful',
            user: { id: user.id, username: user.username, roles: user.roles }
        });
    });

// ==========================================
// Post Routes (protected with auth + RBAC + validation)
// ==========================================
const listPostsRoute = new HTTPServer.Route('/posts', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('read', 'posts'))
    .route(async (req, res) => {
        return res.send({
            posts: Array.from(posts.values()),
            count: posts.size
        });
    });

const createPostRoute = new HTTPServer.Route('/posts', HTTPServer.RequestType.POST)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('create', 'posts'))
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            title: Joi.string().min(1).max(200).required(),
            content: Joi.string().min(1).required()
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const user = req.getUser()!;
        const id = nextPostId++;
        const post = { id, title: body.title, content: body.content, authorId: user.id };
        posts.set(id, post);
        return res.send({ message: 'Post created', post });
    });

const getPostRoute = new HTTPServer.Route('/posts/:id', HTTPServer.RequestType.GET)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('read', 'posts'))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const post = posts.get(id);
        if (!post) throw new HTTPServer.NotFoundError(`Post ${id} not found`);
        return res.send({ post });
    });

const updatePostRoute = new HTTPServer.Route('/posts/:id', HTTPServer.RequestType.PUT)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('update', 'posts'))
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            title: Joi.string().min(1).max(200),
            content: Joi.string().min(1)
        })
    }))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const post = posts.get(id);
        if (!post) throw new HTTPServer.NotFoundError(`Post ${id} not found`);
        const body = req.getRequest().body;
        if (body.title) post.title = body.title;
        if (body.content) post.content = body.content;
        posts.set(id, post);
        return res.send({ message: 'Post updated', post });
    });

const deletePostRoute = new HTTPServer.Route('/posts/:id', HTTPServer.RequestType.DELETE)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('delete', 'posts'))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        if (!posts.has(id)) throw new HTTPServer.NotFoundError(`Post ${id} not found`);
        posts.delete(id);
        return res.send({ message: 'Post deleted', id });
    });

// ==========================================
// Error demo route
// ==========================================
const errorDemoRoute = new HTTPServer.Route('/error-demo/:type', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const type = req.getRequest().params.type;
        switch (type) {
            case 'notfound': throw new HTTPServer.NotFoundError('Resource not found');
            case 'unauthorized': throw new HTTPServer.UnauthorizedError('Not authorized');
            case 'conflict': throw new HTTPServer.ConflictError('Resource conflict');
            case 'custom': throw new HTTPServer.AppError('Custom error', 418);
            default: throw new Error('Unexpected error');
        }
    });

// ==========================================
// Register all routes
// ==========================================
const authGroup = new HTTPServer.RouteGroup('/auth');
authGroup.route(registerRoute, loginRoute);

const apiGroup = new HTTPServer.RouteGroup('/api');
apiGroup.route(
    listPostsRoute,
    createPostRoute,
    getPostRoute,
    updatePostRoute,
    deletePostRoute,
    errorDemoRoute
);

server.addRoute(healthRoute);
server.addRoute(authGroup);
server.addRoute(apiGroup);

HTTPServer.Logger.info('[Example] Combined example running on port 3000');
HTTPServer.Logger.info('[Example] Flow: POST /auth/register -> POST /auth/login -> GET/POST/PUT/DELETE /api/posts');
server.start();
