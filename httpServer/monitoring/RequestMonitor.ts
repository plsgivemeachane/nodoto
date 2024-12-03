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

export default abstract class RequestMonitor {
    /**
     * Handles incoming requests by setting up timeout monitoring.
     * Sets a timeout based on server configuration and tracks request timing.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected abstract handleRequest(req: NRequest, res: NResponse): void

    /**
     * Cleans up resources associated with a request.
     * Clears timeout handlers and removes request tracking data.
     * @param req - Express Request object
     * @param res - Express Response object
     */
    protected abstract cleanup(req: NRequest, res: NResponse, requestId: string): void 
    /**
     * Handles request timeout events.
     * Sends a timeout response and notifies observers.
     * @param req - Express Request object
     * @param res - Express Response object
     * @param requestId - Unique identifier for the request
     * @param timeoutDuration - Duration after which the request timed out
     */
    protected abstract handleTimeout(req: NRequest, res: NResponse, requestId: string, timeoutDuration: number): void
}
