import { Request } from "express";
import EventManager from "../../monitoring/EventManager";
import { RequestEvent } from "../../monitoring/RequestEvent";
import Utils from "../../../utils/utils";
import { User } from "../../auth/rbac/types";

type EventListener = (event: RequestEvent) => void;

/**
 * Class representing a wrapped HTTP request.
 * Provides additional functionality such as emitting events based on the request's lifecycle.
 *
 * NRequest can both EMIT events (request:start, request:data, etc.)
 * and RECEIVE events from EventManager (e.g. response:close, kill signals).
 * This solves the design problem where the injectable request could not be stopped.
 *
 * @see RequestEvent
 */
export default class NRequest {
    private readonly req: Request;
    private readonly eventManager: EventManager;
    private startTime: number;
    public readonly ID = Utils.snowflakeId();

    private user: User | undefined;
    private killed: boolean = false;
    private readonly eventListeners: Map<string, EventListener[]> = new Map();

    constructor(req: Request) {
        this.req = req;
        this.eventManager = EventManager.getInstance();
        this.startTime = Date.now();
        this.setupDefaultEvents();
        this.setupEventReceiving();
    }

    private setupDefaultEvents(): void {
        // Data event
        this.req.on('data', (chunk) => {
            this.emitEvent('request:data', {
                data: chunk,
                size: chunk.length
            });
        });

        // End event
        this.req.on('end', () => {
            this.emitEvent('request:end', {
                totalTime: Date.now() - this.startTime
            });
        });

        // Error event
        this.req.on('error', () => {
            this.emitEvent('request:error');
        });

        // Close event
        this.req.on('close', () => {
            this.emitEvent('request:close');
        });

        // Fire request start event
        this.emitEvent('request:start');
    }

    /**
     * Subscribe to events from EventManager so NRequest can react to
     * events emitted by other parts of the system (e.g. response:close,
     * response:error, or kill signals).
     *
     * This solves the design problem from EVENTMNG.md:
     * "the injectable request should be able to receive the event in event manager."
     */
    private setupEventReceiving(): void {
        // Listen for response:close — response was closed, mark request as done
        this.eventManager.registerListener('response:close', (event: RequestEvent) => {
            if (event.request.ID === this.ID) {
                this.killed = true;
                this.notifyListener('response:close', event);
            }
        });

        // Listen for response:error — response errored, mark request as done
        this.eventManager.registerListener('response:error', (event: RequestEvent) => {
            if (event.request.ID === this.ID) {
                this.killed = true;
                this.notifyListener('response:error', event);
            }
        });
    }

    /**
     * Emit a request event with the given name and data
     * @param eventName The name of the event
     * @param data Additional data for the event
     */
    public emitEvent(eventName: string, data?: any): void {
        const event: RequestEvent = {
            request: this,
            timestamp: Date.now(),
            event: eventName,
            data: data
        };
        this.eventManager.emit(eventName, event);
    }

    /**
     * Register a listener for a specific event on this request.
     * Allows middleware/handlers to react to events received from EventManager.
     * @param eventName The event to listen for
     * @param listener Callback invoked when the event is received
     */
    public on(eventName: string, listener: EventListener): void {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName)!.push(listener);
    }

    /**
     * Notify all registered listeners for a given event.
     */
    private notifyListener(eventName: string, event: RequestEvent): void {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            for (const listener of listeners) {
                listener(event);
            }
        }
    }

    /**
     * Check if this request has been killed/interrupted.
     */
    public isKilled(): boolean {
        return this.killed;
    }

    /**
     * Get the underlying Express request object
     */
    public getRequest(): Request {
        return this.req;
    }

    public setUser(user: User): void {
        this.user = user;
    }

    public getUser(): User | undefined {
        return this.user;
    }
}
