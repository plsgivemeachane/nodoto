import { HTTPServer } from '../../';

// === ECHO SERVER TEMPLATE ===
// Minimal server that echoes requests back.
// Supports all HTTP methods.

HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'info',
    useJsonParser: true,
    useUrlParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// Echo for all methods
const echoRoute = new HTTPServer.Route('/', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const r = req.getRequest();
        return res.send({
            method: r.method,
            url: r.url,
            query: r.query,
            headers: r.headers,
            body: r.body,
            ip: r.ip
        });
    });

const echoPostRoute = new HTTPServer.Route('/', HTTPServer.RequestType.POST)
    .route(async (req, res) => {
        const r = req.getRequest();
        return res.send({ method: 'POST', body: r.body, headers: r.headers });
    });

const echoParamRoute = new HTTPServer.Route('/echo/:msg', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        return res.send({
            echo: req.getRequest().params.msg,
            timestamp: Date.now()
        });
    });

server.addRoute(echoRoute);
server.addRoute(echoPostRoute);
server.addRoute(echoParamRoute);
server.start();
