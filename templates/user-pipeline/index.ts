import { AuthManager, ConflictError, HTTPServer, Middlewares, NotFoundError, RequestType, Route, RouteGroup, UnauthorizedError, Validator, checkPermission, logger } from '../../';
import type { User } from '../../';
import Joi from 'joi';

// === FULL USER PIPELINE TEMPLATE ===
// Register -> Login (JWT + bcrypt) -> RBAC -> Validation -> Error Handling
// Password hashing is AUTOMATIC via AuthManager.

interface StoredUser { id: string; username: string; passwordHash: string; roles: string[] }
const users: Map<string, StoredUser> = new Map();

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// --- Auth ---

// POST /auth/register — password is automatically hashed by AuthManager.register()
const register = new Route('/auth/register', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer')
        })
    }))
    .route(AuthManager.register()) // Automatically hashes password, generates JWT
    .route(async (req, res) => {
        const body = req.getRequest().body;
        if (users.has(body.username)) throw new ConflictError('Username already taken');

        // Store user with hashed password (hashing already done by AuthManager)
        users.set(body.username, {
            id: body._user.id,
            username: body.username,
            passwordHash: body.password, // Already hashed!
            roles: body.roles
        });

        return res.send({
            message: 'Registered successfully',
            token: body._token,
            user: body._user
        });
    });

// POST /auth/login — password is automatically verified by AuthManager.login()
const login = new Route('/auth/login', RequestType.POST)
    .route(Validator.validate({
        body: Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required()
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const stored = users.get(body.username);
        if (!stored) throw new UnauthorizedError('Invalid credentials');

        // Attach stored data for AuthManager.login() to use
        body._storedHash = stored.passwordHash;
        body._userId = stored.id;
        body._roles = stored.roles;
        return true; // Continue to AuthManager.login()
    })
    .route(AuthManager.login()); // Automatically verifies password, generates JWT

// GET /auth/me — requires JWT auth
const me = new Route('/auth/me', RequestType.GET)
    .route(AuthManager.jwtAuth()) // Automatically verifies JWT and sets user
    .route(async (req, res) => {
        return res.send({ user: req.getUser() });
    });

// --- Posts (RBAC protected with JWT auth) ---
const posts: Map<number, { id: number; title: string; author: string }> = new Map();
let nextId = 1;

const listPosts = new Route('/posts', RequestType.GET)
    .route(AuthManager.jwtAuth())
    .route(checkPermission('read', 'posts'))
    .route(async (req, res) => {
        return res.send({ posts: Array.from(posts.values()), count: posts.size });
    });

const createPost = new Route('/posts', RequestType.POST)
    .route(AuthManager.jwtAuth())
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
    .route(AuthManager.jwtAuth())
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
