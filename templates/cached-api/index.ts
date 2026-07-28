import { HTTPServer, Route, RequestType } from '../../httpServer';
import RedisHelper from '../../httpServer/databases/RedisHelper';
import { RateLimiter } from '../../httpServer/middleware/RateLimiter';
import { NotFoundError } from '../../httpServer/errors/AppError';
import { logger } from '../../utils/winston';

// === CACHED API SERVER TEMPLATE ===
// Redis-backed caching layer for API responses.

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

const redis = RedisHelper.getInstance();

// Helper to connect lazily
async function ensureRedis() {
    if (!redis.isConnected()) {
        await redis.connect({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    }
}

// GET /data/:key — fetch from cache or compute
const getData = new Route('/data/:key', RequestType.GET)
    .route(RateLimiter.create({ windowMs: 60000, max: 50 }))
    .route(async (req, res) => {
        await ensureRedis();
        const key = req.getRequest().params.key;

        // Try cache first
        const cached = await redis.get(`data:${key}`);
        if (cached) {
            logger.verbose(`[Template] Cache hit: ${key}`);
            return res.send({ source: 'cache', key, data: JSON.parse(cached) });
        }

        // Cache miss — "compute" the data
        logger.verbose(`[Template] Cache miss: ${key}`);
        const data = { key, value: `computed-${Date.now()}`, timestamp: Date.now() };

        // Store in cache with 60s TTL
        await redis.set(`data:${key}`, JSON.stringify(data), 60);

        return res.send({ source: 'computed', data });
    });

// DELETE /data/:key — invalidate cache
const invalidate = new Route('/data/:key', RequestType.DELETE)
    .route(async (req, res) => {
        await ensureRedis();
        const key = req.getRequest().params.key;
        await redis.del(`data:${key}`);
        return res.send({ message: 'Cache invalidated', key });
    });

// GET /cache/stats — check Redis connection
const cacheStats = new Route('/cache/stats', RequestType.GET)
    .route(async (req, res) => {
        return res.send({ connected: redis.isConnected() });
    });

const health = new Route('/health', RequestType.GET)
    .route(async (req, res) => {
        return res.send({ status: 'healthy', redis: redis.isConnected() });
    });

server.addRoute(health);
server.addRoute(getData);
server.addRoute(invalidate);
server.addRoute(cacheStats);

logger.info('[Template] Cached API Server running on port 3000');
logger.info('[Template] Requires Redis on localhost:6379');
server.start();
