import { HTTPServer } from '../../';
import Joi from 'joi';

// In-memory data store
const posts: Map<number, { id: number; title: string; content: string; author: string }> = new Map();
let nextId = 1;

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// --- Routes ---

// GET /posts — list all posts (public)
const listPostsRoute = new HTTPServer.Route('/posts', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            posts: Array.from(posts.values()),
            count: posts.size
        });
    });

// GET /posts/:id — get single post (public)
const getPostRoute = new HTTPServer.Route('/posts/:id', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const post = posts.get(id);
        if (!post) {
            throw new HTTPServer.NotFoundError(`Post ${id} not found`);
        }
        return res.send({ post });
    });

// POST /posts — create post (auth + RBAC + validation)
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
        const user = req.getUser();
        const id = nextId++;
        const post = { id, title: body.title, content: body.content, author: user?.username || 'unknown' };
        posts.set(id, post);
        HTTPServer.Logger.info(`[Example] Post created: ${id}`);
        return res.send({ message: 'Post created', post });
    });

// PUT /posts/:id — update post (auth + RBAC + validation)
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
        if (!post) {
            throw new HTTPServer.NotFoundError(`Post ${id} not found`);
        }
        const body = req.getRequest().body;
        if (body.title) post.title = body.title;
        if (body.content) post.content = body.content;
        posts.set(id, post);
        return res.send({ message: 'Post updated', post });
    });

// DELETE /posts/:id — delete post (auth + RBAC)
const deletePostRoute = new HTTPServer.Route('/posts/:id', HTTPServer.RequestType.DELETE)
    .route(HTTPServer.Middlewares.auth)
    .route(HTTPServer.checkPermission('delete', 'posts'))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        if (!posts.has(id)) {
            throw new HTTPServer.NotFoundError(`Post ${id} not found`);
        }
        posts.delete(id);
        return res.send({ message: 'Post deleted', id });
    });

// Group all post routes under /api
const apiGroup = new HTTPServer.RouteGroup('/api');
apiGroup.route(listPostsRoute, getPostRoute, createPostRoute, updatePostRoute, deletePostRoute);

// Health check
const healthRoute = new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy', posts: posts.size });
    });

server.addRoute(healthRoute);
server.addRoute(apiGroup);
server.start();
