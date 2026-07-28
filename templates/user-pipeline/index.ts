import { HTTPServer, Route, RouteGroup, RequestType } from '../../httpServer';
import Middlewares from '../../httpServer/routing/Middleware';
import { checkPermission } from '../../httpServer/auth/rbac/middleware';
import { User } from '../../httpServer/auth/rbac/types';
import { Validator } from '../../httpServer/validation/Validator';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../httpServer/errors/AppError';
import Joi from 'joi';
import { logger } from '../../utils/winston';

// === FULL USER PIPELINE TEMPLATE ===
// Register -> Login (JWT) -> RBAC -> Validation -> Error Handling
// Everything wired together in a ready-to-run server.

const users: Map<string, { id: string; username: string; password: string; roles: string[] }> = new Map();

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// --- Auth ---
const register = new Route('/auth/register', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer')
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        if (users.has(body.username)) throw new ConflictError('Username already taken');
        const userId = Date.now().toString();
        users.set(body.username, { id: userId, username: body.username, password: body.password, roles: [body.role] });
        return res.send({ message: 'Registered', user: { id: userId, username: body.username, roles: [body.role] } });
    });

const login = new Route('/auth/login', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const user = users.get(body.username);
        if (!user || user.password !== body.password) throw new UnauthorizedError('Invalid credentials');
        req.setUser({ id: user.id, username: user.username, roles: user.roles });
        return res.send({ message: 'Login successful', user: { id: user.id, username: user.username, roles: user.roles } });
    });

const me = new Route('/auth/me', RequestType.GET)
    .route(Middlewares.auth)
    .route(async (req, res) => {
        const user = req.getUser();
        if (!user) throw new UnauthorizedError('Not authenticated');
        return res.send({ user });
    });

// --- Posts (RBAC protected) ---
const posts: Map<number, { id: number; title: string; author: string }> = new Map();
let nextId = 1;

const listPosts = new Route('/posts', RequestType.GET)
    .route(Middlewares.auth)
    .route(checkPermission('read', 'posts'))
    .route(async (req, res) => {
        return res.send({ posts: Array.from(posts.values()), count: posts.size });
    });

const createPost = new Route('/posts', RequestType.POST)
    .route(Middlewares.auth)
    .route(checkPermission('create', 'posts'))
    .route(Validator.validate({
        body: Joi.object({ title: Joi.string().min(1).max(200).required() })
    }))
    .route(async (req, res) => {
        const user = req.getUser()!;
        const id = nextId++;
        const post = { id, title: req.getRequest().body.title, author: user.username };
        posts.set(id, post);
        return res.send({ message: 'Post created', post });
    });

const deletePost = new Route('/posts/:id', RequestType.DELETE)
    .route(Middlewares.auth)
    .route(checkPermission('delete', 'posts'))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        if (!posts.has(id)) throw new NotFoundError(`Post ${id} not found`);
        posts.delete(id);
        return res.send({ message: 'Post deleted', id });
    });

// --- Health ---
const health = new Route('/health', RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy', users: users.size, posts: posts.size });
    });

// --- Register ---
const authGroup = new RouteGroup('/auth');
authGroup.route(register, login, me);

const apiGroup = new RouteGroup('/api');
apiGroup.route(listPosts, createPost, deletePost);

server.addRoute(health);
server.addRoute(authGroup);
server.addRoute(apiGroup);

logger.info('[Template] Full User Pipeline running on port 3000');
logger.info('[Template] Flow: POST /auth/register -> POST /auth/login -> GET /auth/me -> GET/POST /api/posts');
server.start();
