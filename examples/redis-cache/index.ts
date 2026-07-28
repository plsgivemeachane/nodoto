import { HTTPServer, Route, RequestType } from '../../httpServer';
import RedisHelper from '../../httpServer/databases/RedisHelper';
import { logger } from '../../utils/winston';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// Connect to Redis
// Make sure Redis is running on localhost:6379
const redis = RedisHelper.getInstance();

// GET /cache/:key — get value from Redis
const getCacheRoute = new Route('/cache/:key', RequestType.GET)
    .route(async (req, res) => {
        try {
            await redis.connect({ url: 'redis://localhost:6379' });
        } catch (e) {
            // Already connected
        }

        const key = req.getRequest().params.key;
        const value = await redis.get(key);

        if (value === null) {
            return res.json({ message: 'Key not found', key }, 404);
        }

        return res.send({
            key,
            value: JSON.parse(value)
        });
    });

// POST /cache/:key — set value in Redis with optional TTL
const setCacheRoute = new Route('/cache/:key', RequestType.POST)
    .route(async (req, res) => {
        try {
            await redis.connect({ url: 'redis://localhost:6379' });
        } catch (e) {
            // Already connected
        }

        const key = req.getRequest().params.key;
        const body = req.getRequest().body;
        const ttl = body.ttl ? parseInt(body.ttl) : undefined;

        await redis.set(key, JSON.stringify(body.value), ttl);
        logger.info(`[Example] Set cache key: ${key}, TTL: ${ttl || 'none'}`);

        return res.send({
            message: 'Cached successfully',
            key,
            ttl: ttl || null
        });
    });

// DELETE /cache/:key — delete from Redis
const delCacheRoute = new Route('/cache/:key', RequestType.DELETE)
    .route(async (req, res) => {
        try {
            await redis.connect({ url: 'redis://localhost:6379' });
        } catch (e) {
            // Already connected
        }

        const key = req.getRequest().params.key;
        await redis.del(key);

        return res.send({
            message: 'Deleted',
            key
        });
    });

// GET /cache/check/:key — check if key exists
const existsCacheRoute = new Route('/cache/check/:key', RequestType.GET)
    .route(async (req, res) => {
        try {
            await redis.connect({ url: 'redis://localhost:6379' });
        } catch (e) {
            // Already connected
        }

        const key = req.getRequest().params.key;
        const exists = await redis.exists(key);

        return res.send({
            key,
            exists
        });
    });

// GET /redis/status — check connection status
const statusRoute = new Route('/redis/status', RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            connected: redis.isConnected()
        });
    });

server.addRoute(getCacheRoute);
server.addRoute(setCacheRoute);
server.addRoute(delCacheRoute);
server.addRoute(existsCacheRoute);
server.addRoute(statusRoute);
server.start();
