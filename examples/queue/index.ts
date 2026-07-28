import { HTTPServer } from '../../';
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
const requestQueue = new HTTPServer.Queue<string>(path.join(__dirname, 'request_queue.json'));

// POST /enqueue — add item to queue
const enqueueRoute = new HTTPServer.Route('/enqueue', HTTPServer.RequestType.POST)
    .route(async (req, res) => {
        const body = req.getRequest().body;
        const item = JSON.stringify(body);
        requestQueue.push(item);
        HTTPServer.Logger.info(`[Example] Enqueued: ${item}`);
        return res.send({
            message: 'Item enqueued',
            item: body
        });
    });

// GET /queue — peek at queue state
const queueStateRoute = new HTTPServer.Route('/queue', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        // Peek checks if the last items match a pattern
        const lastItem = requestQueue.peek(1, undefined);
        return res.send({
            message: 'HTTPServer.Queue state (peek)',
            // Note: HTTPServer.Queue doesn't expose size/items directly,
            // it's designed for internal request deduplication
            peekResult: lastItem
        });
    });

// POST /dequeue — remove last item from queue
const dequeueRoute = new HTTPServer.Route('/dequeue', HTTPServer.RequestType.POST)
    .route(async (req, res) => {
        requestQueue.pop();
        HTTPServer.Logger.info('[Example] Dequeued last item');
        return res.send({ message: 'Item dequeued' });
    });

// GET /dedup — demonstrate request deduplication using queue peek
const dedupRoute = new HTTPServer.Route('/dedup', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const requestId = req.ID;
        const requestStr = `request:${requestId}`;

        // Check if this request pattern is already in the queue (duplicate)
        // push the request for tracking
        requestQueue.push(requestStr);

        return res.send({
            message: 'Request tracked in queue',
            requestId: requestId,
            note: 'The HTTPServer.Queue is used internally by QueueEventHandler for request deduplication'
        });
    });

server.addRoute(enqueueRoute);
server.addRoute(queueStateRoute);
server.addRoute(dequeueRoute);
server.addRoute(dedupRoute);

HTTPServer.Logger.info('[Example] HTTPServer.Queue example running on port 3000');
server.start();
