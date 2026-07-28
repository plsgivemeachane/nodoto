import { HTTPServer, RequestType, Route, Utils, logger } from '../../';

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
const infoRoute = new Route('/log/info', RequestType.GET)
    .route(async (req, res) => {
        logger.info('[Example] This is an info log');
        return res.send({ message: 'Info logged', level: 'info' });
    });

// GET /log/warn — warn log
const warnRoute = new Route('/log/warn', RequestType.GET)
    .route(async (req, res) => {
        logger.warn('[Example] This is a warning log');
        return res.send({ message: 'Warning logged', level: 'warn' });
    });

// GET /log/error — error log
const errorRoute = new Route('/log/error', RequestType.GET)
    .route(async (req, res) => {
        logger.error('[Example] This is an error log');
        return res.send({ message: 'Error logged', level: 'error' });
    });

// GET /log/verbose — verbose log
const verboseRoute = new Route('/log/verbose', RequestType.GET)
    .route(async (req, res) => {
        logger.verbose('[Example] This is a verbose log (very detailed)');
        return res.send({ message: 'Verbose logged', level: 'verbose' });
    });

// GET /log/all — log at all levels
const allLogRoute = new Route('/log/all', RequestType.GET)
    .route(async (req, res) => {
        logger.verbose('[Example] Verbose: Detailed debugging info');
        logger.debug('[Example] Debug: Debugging info');
        logger.info('[Example] Info: General information');
        logger.warn('[Example] Warn: Warning message');
        logger.error('[Example] Error: Error message');
        return res.send({ message: 'All log levels demonstrated' });
    });

// GET /utils — demonstrate Utils.sleep and Utils.defer
const utilsRoute = new Route('/utils', RequestType.GET)
    .route(async (req, res) => {
        const id = Utils.snowflakeId();
        logger.info(`[Example] Generated snowflake ID: ${id}`);

        Utils.defer(() => {
            logger.info('[Example] Deferred function executed after response');
        }, 1000);

        await Utils.sleep(100);
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

logger.info('[Example] Logging example server running on port 3000');
server.start();
