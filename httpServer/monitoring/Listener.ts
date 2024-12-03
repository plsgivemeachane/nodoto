import { Request, Response } from 'express';
import Observable from '../../utils/Observable';
import { logger } from '../../utils/winston';
import { RequestEvent } from './RequestEvent';

/**
 * Abstract base class for monitoring HTTP requests.
 * Provides core functionality for request event handling and observer pattern implementation.
 */
export abstract class EventListener {
    /** Observable instance for implementing the observer pattern */
    protected observable: Observable<RequestEvent>;
    
    constructor() {
        this.observable = new Observable<RequestEvent>();
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
}
