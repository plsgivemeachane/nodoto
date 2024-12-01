import { Request, Response } from 'express';
import Observable from '../../utils/Observable';
import { logger } from '../../utils/winston';

/**
 * Interface representing a monitoring event for HTTP requests.
 * Contains essential information about the request including timing and client details.
 */
export interface RequestEvent {
    /** The HTTP method used (GET, POST, etc.) */
    method: string;
    /** The requested URL path */
    url: string;
    /** Time taken to process the request in milliseconds */
    duration: number;
    /** Unix timestamp when the request was received */
    timestamp: number;
    /** Client's IP address */
    ip?: string;
    /** Request headers */
    headers: any;
}

/**
 * Abstract base class for monitoring HTTP requests.
 * Provides core functionality for request event handling and observer pattern implementation.
 */
export abstract class RequestMonitor {
    /** Observable instance for implementing the observer pattern */
    protected observable: Observable<RequestEvent>;
    
    constructor() {
        this.observable = new Observable<RequestEvent>();
    }

    /**
     * Creates a monitoring event from a request and its duration.
     * @param req - Express Request object containing request details
     * @param duration - Time taken to process the request in milliseconds
     * @returns RequestEvent object containing request monitoring data
     */
    protected createEvent(req: Request, duration: number): RequestEvent {
        return {
            method: req.method,
            url: req.url,
            duration: duration,
            timestamp: Date.now(),
            ip: req.ip,
            headers: req.headers
        };
    }

    /**
     * Subscribes a callback function to receive request monitoring events.
     * @param callback - Function to be called when a request event occurs
     */
    public subscribe(callback: (event: RequestEvent) => void): void {
        this.observable.subscribe(callback);
    }

    /**
     * Unsubscribes a callback function from receiving request monitoring events.
     * @param callback - Function to be removed from the observers list
     */
    public unsubscribe(callback: (event: RequestEvent) => void): void {
        this.observable.unsubscribe(callback);
    }

    /**
     * Abstract method to handle incoming requests.
     * Must be implemented by concrete monitor classes.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected abstract handleRequest(req: Request, res: Response, requestId: string): void;

    /**
     * Abstract method to clean up resources after request completion.
     * Must be implemented by concrete monitor classes.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected abstract cleanup(req: Request, res: Response, requestId: string): void;
}
