import { HTTPServer, Route, RouteGroup, RequestType } from '../../httpServer';
import { Validator } from '../../httpServer/validation/Validator';
import { NotFoundError } from '../../httpServer/errors/AppError';
import { RateLimiter } from '../../httpServer/middleware/RateLimiter';
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

const listItems = new Route('/items', RequestType.GET)
    .route(RateLimiter.create({ windowMs: 60000, max: 100 }))
    .route(async (req, res) => {
        return res.send({ items: Array.from(items.values()), count: items.size });
    });

const getItem = new Route('/items/:id', RequestType.GET)
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const item = items.get(id);
        if (!item) throw new NotFoundError(`Item ${id} not found`);
        return res.send({ item });
    });

const createItem = new Route('/items', RequestType.POST)
    .route(RateLimiter.create({ windowMs: 60000, max: 20 }))
    .route(Validator.validate({
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

const updateItem = new Route('/items/:id', RequestType.PUT)
    .route(Validator.validate({
        body: Joi.object({
            name: Joi.string().min(1).max(100),
            description: Joi.string().max(500),
            price: Joi.number().positive()
        })
    }))
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        const item = items.get(id);
        if (!item) throw new NotFoundError(`Item ${id} not found`);
        const body = req.getRequest().body;
        if (body.name) item.name = body.name;
        if (body.description) item.description = body.description;
        if (body.price) item.price = body.price;
        items.set(id, item);
        return res.send({ message: 'Item updated', item });
    });

const deleteItem = new Route('/items/:id', RequestType.DELETE)
    .route(async (req, res) => {
        const id = parseInt(req.getRequest().params.id);
        if (!items.has(id)) throw new NotFoundError(`Item ${id} not found`);
        items.delete(id);
        return res.send({ message: 'Item deleted', id });
    });

const health = new Route('/health', RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy', items: items.size });
    });

const api = new RouteGroup('/api');
api.route(listItems, getItem, createItem, updateItem, deleteItem);

server.addRoute(health);
server.addRoute(api);
server.start();
