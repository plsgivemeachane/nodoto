import { HTTPServer } from '../../';

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug',
    useJsonParser: true,
    useUrlParser: true,
    corsSetting: { origin: '*' }
});
const server = HTTPServer.getInstance();

// GET / — echo query params and headers
const echoGetRoute = new HTTPServer.Route('/', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        return res.send({
            method: 'GET',
            url: expressReq.url,
            query: expressReq.query,
            headers: expressReq.headers,
            ip: expressReq.ip
        });
    });

// POST / — echo body
const echoPostRoute = new HTTPServer.Route('/', HTTPServer.RequestType.POST)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        return res.send({
            method: 'POST',
            url: expressReq.url,
            body: expressReq.body,
            headers: expressReq.headers,
            ip: expressReq.ip
        });
    });

// PUT / — echo body
const echoPutRoute = new HTTPServer.Route('/', HTTPServer.RequestType.PUT)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        return res.send({
            method: 'PUT',
            body: expressReq.body
        });
    });

// PATCH / — echo body
const echoPatchRoute = new HTTPServer.Route('/', HTTPServer.RequestType.PATCH)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        return res.send({
            method: 'PATCH',
            body: expressReq.body
        });
    });

// DELETE / — echo params
const echoDeleteRoute = new HTTPServer.Route('/', HTTPServer.RequestType.DELETE)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        return res.send({
            method: 'DELETE',
            url: expressReq.url,
            query: expressReq.query
        });
    });

// HEAD / — echo with no body
const echoHeadRoute = new HTTPServer.Route('/', HTTPServer.RequestType.HEAD)
    .route(async (req, res) => {
        return res.send({ method: 'HEAD', timestamp: Date.now() });
    });

// Any path echo
const echoAnyRoute = new HTTPServer.Route('/echo/:anything', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const expressReq = req.getRequest();
        return res.send({
            echo: expressReq.params.anything,
            timestamp: Date.now()
        });
    });

server.addRoute(echoGetRoute);
server.addRoute(echoPostRoute);
server.addRoute(echoPutRoute);
server.addRoute(echoPatchRoute);
server.addRoute(echoDeleteRoute);
server.addRoute(echoHeadRoute);
server.addRoute(echoAnyRoute);

HTTPServer.Logger.info('[Example] Echo server running. Send any request to get it echoed back.');
server.start();
