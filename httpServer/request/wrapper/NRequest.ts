import { Request } from "express";
import EventManager from "../../monitoring/EventManager";
import { RequestEvent } from "../../monitoring/RequestEvent";
import Utils from "../../../utils/utils";
import { User } from "../../auth/rbac/types";

/**
 * Class representing a wrapped HTTP request.
 * Provides additional functionality such as emitting events based on the request's lifecycle.
 * @see RequestEvent
 */
export default class NRequest {
    private readonly req: Request;
    private readonly eventManager: EventManager;
    private startTime: number;
    public readonly ID = Utils.snowflakeId();

    private user: User | undefined;

    constructor(req: Request) {
        this.req = req;
        this.eventManager = EventManager.getInstance();
        this.startTime = Date.now();
        this.setupDefaultEvents();
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
        this.req.on('error', (error) => {
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