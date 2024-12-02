import { NextFunction, Request, Response } from 'express';
import { RequestMonitor } from './RequestMonitor';
import { HTTPServer } from '../HTTPServer';
import { logger } from '../../utils/winston';
import Utils from '../../utils/utils';
import { RequestEvent } from './ReuqestEvent';

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
        const requestId = Utils.snowflakeId();

        logger.verbose({
            message: '[Timeout] Incoming request ' + requestId
        });

        // // Save original response methods
        // const originalJson = res.json.bind(res);
        // const originalSend = res.send.bind(res);

        // // Override response methods to cleanup timeouts
        // res.json = (...args: any[]) => {
        //     this.cleanup(req, res, requestId);
        //     return originalJson(...args);
        // };
        
        // res.send = (...args: any[]) => {
        //     this.cleanup(req, res, requestId);
        //     return originalSend(...args);
        // };

        this.startTimes.set(requestId, Date.now());

        const timeoutDuration = HTTPServer.config.timeout || 30000;
        const timeoutId = setTimeout(() => {
            // Double-check if the request has not been completed
            if (this.timeouts.has(requestId)) {
                this.handleTimeout(req, res, requestId, timeoutDuration);
            }
        }, timeoutDuration);

        this.timeouts.set(requestId, timeoutId);

        // Cleanup handlers
        res.on('finish', () => this.cleanup(req, res, requestId));
        res.on('close', () => this.cleanup(req, res, requestId));
    }

    /**
     * Cleans up resources associated with a request.
     * Clears timeout handlers and removes request tracking data.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected cleanup(req: Request, res: Response, requestId: string): void {
        logger.debug(`[Timeout] Cleaning up request ${requestId}`);
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

        logger.debug(`[Timeout] Request ${requestId} timed out`);

        const startTime = this.startTimes.get(requestId);
        if (!startTime) {
            logger.warn({
                message: '[Timeout] Request timed out, but start time not found',
                requestId
            });
            return;
        }

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
        this.cleanup(req, res, requestId);
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
     * Express middleware function for request timeout monitoring.
     * @param req - Express Request object
     * @param res - Express Response object
     * @param next - Express NextFunction
     */
    public static middleware(req: Request, res: Response): boolean{
        TimeoutMonitor.getInstance().handleRequest(req, res);
        return true;
    }
}
