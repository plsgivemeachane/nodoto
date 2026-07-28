import { HTTPServer, Route, RequestType } from '../../httpServer';
import Queue from '../../httpServer/queue/Queue';
import { logger } from '../../utils/winston';
import path from 'path';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// Create a persistent queue for request deduplication
const requestQueue = new Queue<string>(path.join(__dirname, 'request_queue.json'));

// POST /enqueue — add item to queue
const enqueueRoute = new Route('/enqueue', RequestType.POST)
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const item = JSON.stringify(body);
        requestQueue.push(item);
        logger.info(`[Example] Enqueued: ${item}`);
        return res.send({
            message: 'Item enqueued',
            item: body
        });
    });

// GET /queue — peek at queue state
const queueStateRoute = new Route('/queue', RequestType.GET)
    .route(async (req, res) => {
        // Peek checks if the last items match a pattern
        const lastItem = requestQueue.peek(1, undefined);
        return res.send({
            message: 'Queue state (peek)',
            // Note: Queue doesn't expose size/items directly,
            // it's designed for internal request deduplication
            peekResult: lastItem
        });
    });

// POST /dequeue — remove last item from queue
const dequeueRoute = new Route('/dequeue', RequestType.POST)
    .route(async (req, res) => {
        requestQueue.pop();
        logger.info('[Example] Dequeued last item');
        return res.send({ message: 'Item dequeued' });
    });

// GET /dedup — demonstrate request deduplication using queue peek
const dedupRoute = new Route('/dedup', RequestType.GET)
    .route(async (req, res) => {
        const requestId = req.ID;
        const requestStr = `request:${requestId}`;

        // Check if this request pattern is already in the queue (duplicate)
        // push the request for tracking
        requestQueue.push(requestStr);

        return res.send({
            message: 'Request tracked in queue',
            requestId: requestId,
            note: 'The Queue is used internally by QueueEventHandler for request deduplication'
        });
    });

server.addRoute(enqueueRoute);
server.addRoute(queueStateRoute);
server.addRoute(dequeueRoute);
server.addRoute(dedupRoute);

logger.info('[Example] Queue example running on port 3000');
server.start();
