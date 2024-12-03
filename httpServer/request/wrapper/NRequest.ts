import { Request } from "express";
import EventManager from "../../monitoring/EventManager";
import { RequestEvent } from "../../monitoring/RequestEvent";
import Event from "../../monitoring/event/Event";

export default class NRequest {
    private readonly req: Request;
    private readonly eventManager: EventManager;
    private startTime: number;

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
            this.emitEvent('request:error', {
                error: error.message
            });
        });

        // Close event
        this.req.on('close', () => {
            this.emitEvent('request:close', {});
        });
    }

    /**
     * Emit a request event with the given name and data
     * @param eventName The name of the event
     * @param data Additional data for the event
     */
    public emitEvent(eventName: string, data: any): void {
        const event: RequestEvent = {
            request: this,
            timestamp: Date.now(),
            event: {
                name: eventName,
                data: data,
                timestamp: Date.now()
            }
        };
        this.eventManager.emit(eventName, event);
    }

    /**
     * Get the underlying Express request object
     */
    public getRequest(): Request {
        return this.req;
    }

    public on(eventName: string, listener: (event: RequestEvent) => void): void {
        this.eventManager.on(eventName, listener);
    }

    public once(eventName: string, listener: (event: RequestEvent) => void): void {
        this.eventManager.once(eventName, listener);
    }
}