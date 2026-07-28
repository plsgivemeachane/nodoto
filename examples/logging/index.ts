import { HTTPServer } from '../../';

// Initialize server with verbose logging
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug', // verbose, debug, info, warn, error
    useJsonParser: true
});
const server = HTTPServer.getInstance();

// Demonstrate different log levels

// GET / — info log
const infoRoute = new HTTPServer.Route('/log/info', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        HTTPServer.Logger.info('[Example] This is an info log');
        return res.send({ message: 'Info logged', level: 'info' });
    });

// GET /log/warn — warn log
const warnRoute = new HTTPServer.Route('/log/warn', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        HTTPServer.Logger.warn('[Example] This is a warning log');
        return res.send({ message: 'Warning logged', level: 'warn' });
    });

// GET /log/error — error log
const errorRoute = new HTTPServer.Route('/log/error', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        HTTPServer.Logger.error('[Example] This is an error log');
        return res.send({ message: 'Error logged', level: 'error' });
    });

// GET /log/verbose — verbose log
const verboseRoute = new HTTPServer.Route('/log/verbose', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        HTTPServer.Logger.verbose('[Example] This is a verbose log (very detailed)');
        return res.send({ message: 'Verbose logged', level: 'verbose' });
    });

// GET /log/all — log at all levels
const allLogRoute = new HTTPServer.Route('/log/all', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        HTTPServer.Logger.verbose('[Example] Verbose: Detailed debugging info');
        HTTPServer.Logger.debug('[Example] Debug: Debugging info');
        HTTPServer.Logger.info('[Example] Info: General information');
        HTTPServer.Logger.warn('[Example] Warn: Warning message');
        HTTPServer.Logger.error('[Example] Error: Error message');
        return res.send({ message: 'All log levels demonstrated' });
    });

// GET /utils — demonstrate HTTPServer.Utils.sleep and HTTPServer.Utils.defer
const utilsRoute = new HTTPServer.Route('/utils', HTTPServer.RequestType.GET)
    .route(async (req, res) => {
        const id = HTTPServer.Utils.snowflakeId();
        HTTPServer.Logger.info(`[Example] Generated snowflake ID: ${id}`);

        HTTPServer.Utils.defer(() => {
            HTTPServer.Logger.info('[Example] Deferred function executed after response');
        }, 1000);

        await HTTPServer.Utils.sleep(100);
        return res.send({
            snowflakeId: id,
            message: 'Check server logs for all demonstrations'
        });
    });

server.addRoute(infoRoute);
server.addRoute(warnRoute);
server.addRoute(errorRoute);
server.addRoute(verboseRoute);
server.addRoute(allLogRoute);
server.addRoute(utilsRoute);

HTTPServer.Logger.info('[Example] Logging example server running on port 3000');
server.start();
