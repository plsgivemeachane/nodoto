import { Request, Response } from 'express';
import { RequestMonitor, RequestEvent } from './RequestMonitor';
import { HTTPServer } from '../HTTPServer';
import { logger } from '../../utils/winston';

/**
 * Extended request event interface that includes timeout-specific information.
 */
export interface TimeoutEvent extends RequestEvent {
    /** Duration after which the request timed out (in milliseconds) */
    timeoutDuration: number;
}

/**
 * Monitor class for handling request timeouts in the HTTP server.
 * Implements the Singleton pattern to ensure only one instance exists.
 * Extends RequestMonitor to provide timeout-specific monitoring functionality.
 */
export class TimeoutMonitor extends RequestMonitor {
    /** Map to store timeout handlers for each request */
    private timeouts: Map<string, NodeJS.Timeout>;
    /** Map to store request start times */
    private startTimes: Map<string, number>;
    /** Singleton instance */
    private static instance: TimeoutMonitor;

    /**
     * Private constructor to prevent direct instantiation.
     * Initializes timeout and start time maps.
     */
    private constructor() {
        super();
        this.timeouts = new Map();
        this.startTimes = new Map();
    }

    /**
     * Gets the singleton instance of TimeoutMonitor.
     * Creates a new instance if one doesn't exist.
     * @returns The singleton TimeoutMonitor instance
     */
    public static getInstance(): TimeoutMonitor {
        if (!TimeoutMonitor.instance) {
            TimeoutMonitor.instance = new TimeoutMonitor();
        }
        return TimeoutMonitor.instance;
    }

    /**
     * Handles incoming requests by setting up timeout monitoring.
     * Sets a timeout based on server configuration and tracks request timing.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected handleRequest(req: Request, res: Response): void {
        const requestId = this.generateRequestId(req);
        this.startTimes.set(requestId, Date.now());

        const timeoutDuration = HTTPServer.config.timeout || 30000;
        const timeoutId = setTimeout(() => {
            this.handleTimeout(req, res, requestId, timeoutDuration);
        }, timeoutDuration);

        this.timeouts.set(requestId, timeoutId);

        // Cleanup handlers
        res.on('finish', () => this.cleanup(req, res));
        req.on('close', () => this.cleanup(req, res));
    }

    /**
     * Cleans up resources associated with a request.
     * Clears timeout handlers and removes request tracking data.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected cleanup(req: Request, res: Response): void {
        const requestId = this.generateRequestId(req);
        const timeoutId = this.timeouts.get(requestId);
        
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(requestId);
            this.startTimes.delete(requestId);
        }
    }

    /**
     * Handles request timeout events.
     * Sends a timeout response and notifies observers.
     * @param req - Express Request object
     * @param res - Express Response object
     * @param requestId - Unique identifier for the request
     * @param timeoutDuration - Duration after which the request timed out
     */
    private handleTimeout(req: Request, res: Response, requestId: string, timeoutDuration: number): void {
        const startTime = this.startTimes.get(requestId);
        if (!startTime) return;

        const duration = Date.now() - startTime;
        const event = this.createTimeoutEvent(req, duration, timeoutDuration);

        // Notify observers
        this.observable.notify(event);

        // Log timeout
        logger.warn({
            message: '[Timeout] Request timed out',
            ...event
        });

        // Send response if possible
        if (!res.headersSent) {
            res.status(408).json({
                error: 'Request Timeout',
                message: 'The request took too long to process',
                timeout: timeoutDuration,
                duration: duration
            });
        }

        // Cleanup
        this.cleanup(req, res);
    }

    /**
     * Creates a timeout event with additional timeout-specific information.
     * @param req - Express Request object
     * @param duration - Time elapsed since request start
     * @param timeoutDuration - Configured timeout duration
     * @returns TimeoutEvent object
     */
    private createTimeoutEvent(req: Request, duration: number, timeoutDuration: number): TimeoutEvent {
        return {
            ...this.createEvent(req, duration),
            timeoutDuration
        };
    }

    /**
     * Generates a unique identifier for a request.
     * @param req - Express Request object
     * @returns Unique request identifier
     */
    private generateRequestId(req: Request): string {
        return `${req.method}-${req.url}-${Date.now()}`;
    }

    /**
     * Express middleware function for request timeout monitoring.
     * @param req - Express Request object
     * @param res - Express Response object
     * @param next - Express NextFunction
     */
    public static middleware(req: Request, res: Response, next: Function): void {
        TimeoutMonitor.getInstance().handleRequest(req, res);
        next();
    }
}
