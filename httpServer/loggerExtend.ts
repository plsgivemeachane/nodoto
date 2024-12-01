import { logger } from "../utils/winston";
import { HTTPServer } from "./HTTPServer";

declare module "./HTTPServer" {
    interface HTTPServer {
        logLevelInfo(): void;
        logLevelDebug(): void;
        logLevelError(): void;
        logLevelWarn(): void;
        logLevelFatal(): void;
    }
}

// Extend the HTTPServer class with logging level methods
HTTPServer.prototype.logLevelInfo = function(): void {
    logger.level = 'info';
};

HTTPServer.prototype.logLevelDebug = function(): void {
    logger.level = 'debug';
};

HTTPServer.prototype.logLevelError = function(): void {
    logger.level = 'error';
};

HTTPServer.prototype.logLevelWarn = function(): void {
    logger.level = 'warn';
};