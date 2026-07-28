import { HTTPServer } from '../../';
import Joi from 'joi';

// === REST API SERVER TEMPLATE ===
// CRUD resource with validation, rate limiting, error handling, CORS, and logging.

interface Item { id: number; name: string; description: string; price: number }
const items: Map<number, Item> = new Map();
let nextId = 1;

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    useUrlParser: true,
    corsSetting: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});
const server = HTTPServer.getInstance();

const listItems = new HTTPServer.Route('/items', HTTPServer.RequestType.GET)
    .route(HTTPServer.RateLimiter.create({ windowMs: 60000, max: 100 }))
    .route(async (req, res) => {
        return res.send({ items: Array.from(items.values()), count: items.size });
    });

const getItem = new HTTPServer.Route('/items/:id', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const item = items.get(id);
        if (!item) throw new HTTPServer.NotFoundError(`Item ${id} not found`);
        return res.send({ item });
    });

const createItem = new HTTPServer.Route('/items', HTTPServer.RequestType.POST)
    .route(HTTPServer.RateLimiter.create({ windowMs: 60000, max: 20 }))
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            name: Joi.string().min(1).max(100).required(),
            description: Joi.string().max(500).default(''),
            price: Joi.number().positive().required()
        })
    }))
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const id = nextId++;
        const item: Item = { id, name: body.name, description: body.description, price: body.price };
        items.set(id, item);
        return res.send({ message: 'Item created', item });
    });

const updateItem = new HTTPServer.Route('/items/:id', HTTPServer.RequestType.PUT)
    .route(HTTPServer.Validator.validate({
        body: Joi.object({
            name: Joi.string().min(1).max(100),
            description: Joi.string().max(500),
            price: Joi.number().positive()
        })
    }))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const item = items.get(id);
        if (!item) throw new HTTPServer.NotFoundError(`Item ${id} not found`);
        const body = req.getRequest().body;
        if (body.name) item.name = body.name;
        if (body.description) item.description = body.description;
        if (body.price) item.price = body.price;
        items.set(id, item);
        return res.send({ message: 'Item updated', item });
    });

const deleteItem = new HTTPServer.Route('/items/:id', HTTPServer.RequestType.DELETE)
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        if (!items.has(id)) throw new HTTPServer.NotFoundError(`Item ${id} not found`);
        items.delete(id);
        return res.send({ message: 'Item deleted', id });
    });

const health = new HTTPServer.Route('/health', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy', items: items.size });
    });

const api = new HTTPServer.RouteGroup('/api');
api.route(listItems, getItem, createItem, updateItem, deleteItem);

server.addRoute(health);
server.addRoute(api);
server.start();
