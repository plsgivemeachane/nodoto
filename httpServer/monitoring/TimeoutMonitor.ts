import { NextFunction, Request, Response } from 'express';
import { HTTPServer } from '../HTTPServer';
import { logger } from '../../utils/winston';
import Utils from '../../utils/utils';
import { RequestEvent } from './RequestEvent';
import EventManager from './EventManager';
import TimeoutEvent from './event/impl/TimeoutEvent';
import NRequest from '../request/wrapper/NRequest';
import NResponse from '../request/wrapper/NResponse';
import RequestFinishEvent from './event/impl/RequestFinishEvent';
import RequestMonitor from './RequestMonitor';
import InteruptEvent from './event/impl/InteruptEvent';

/**
 * Monitor class for handling request lifecycle events in the HTTP server.
 * Implements the Singleton pattern to ensure only one instance exists.
 */
export class TimeoutMonitor extends RequestMonitor {
    /** Map to store timeout handlers for each request */
    private timeouts: Map<string, NodeJS.Timeout>;
    /** Map to store request start times */
    private startTimes: Map<string, number>;
    private eventManager: EventManager

    /**
     * Private constructor to prevent direct instantiation.
     * Initializes timeout and start time maps.
     */
    constructor() {
        super();
        this.timeouts = new Map();
        this.startTimes = new Map();
        this.eventManager = EventManager.getInstance();
    }

    /**
     * Cleans up resources associated with a request.
     * Clears timeout handlers and removes request tracking data.
     * @param req - Express Request object
     * @param res - Express Response object
     * @param requestId - Unique identifier for the request
     */
    protected cleanup(req: NRequest, res: NResponse, requestId: string): void {
        const timeout = this.timeouts.get(requestId);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(requestId);
        }
        this.startTimes.delete(requestId);
        
        // // Emit request finish event
        // this.eventManager.emit(RequestFinishEvent.getName(), new RequestFinishEvent(req, res, requestId));
    }

    /**
     * Handles request timeout events.
     * Sends a timeout response and notifies observers.
     * @param req - Express Request object
     * @param res - Express Response object
     * @param requestId - Unique identifier for the request
     * @param timeoutDuration - Duration after which the request timed out
     */
    protected handleTimeout(req: NRequest, res: NResponse, requestId: string, timeoutDuration: number): void {
        logger.warn({
            message: `[Timeout] Request ${requestId} timed out after ${timeoutDuration}ms`
        });

        // Send timeout response
        // res.status(408).json({
        //     error: 'Request Timeout',
        //     message: `Request could not be processed within ${timeoutDuration}ms`
        // });

        // Emit timeout event
        this.eventManager.emit(InteruptEvent.getName(), new InteruptEvent().getReqestEvent(req));

        // Cleanup resources
        this.cleanup(req, res, requestId);
    }

    /**
     * Handles incoming requests by setting up timeout monitoring.
     * Sets a timeout based on server configuration and tracks request timing.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected handleRequest(req: NRequest, res: NResponse): void {
        const requestId = Utils.snowflakeId();

        logger.verbose({
            message: '[Timeout] Incoming request ' + requestId
        });

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
        // res.on('finish', () => this.cleanup(req, res, requestId));
        this.eventManager.on(RequestFinishEvent.getName(), () => this.cleanup(req, res, requestId));
        // res.on('close', () => this.cleanup(req, res, requestId));
    }

    /**
     * Express middleware function for request timeout monitoring.
     * @param req - Express Request object
     * @param res - Express Response object
     * @returns boolean indicating whether the request should proceed
     */
    public middleware(req: NRequest, res: NResponse): boolean {
        this.handleRequest(req, res);
        return true; // Allow request to proceed
    }
}
