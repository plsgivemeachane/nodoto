import { Response } from "express";
import { RequestEvent } from "../../monitoring/RequestEvent";
import EventManager from "../../monitoring/EventManager";
import Utils from "../../../utils/utils";

interface ResponseSent {
    sent: boolean
    data?: any
    method?: "json" | "send";
    status: number
}

/**
 * Wrapper for Express Response object to monitor and log its events (start, data, end, error, close)
 * Also provides methods to send data and close the response
 * @class NResponse
 */
export default class NResponse {
    private readonly res: Response
    private responseData: ResponseSent = {sent: false, status: 200}
    private readonly eventManager: EventManager;
    private readonly startTime: number;
    public readonly ID = Utils.snowflakeId();
    private isClosed = false;
    
    constructor(res: Response) {
        this.res = res;
        this.eventManager = EventManager.getInstance();
        this.startTime = Date.now();
        this.setupDefaultEvents();
    }

    private setupDefaultEvents(): void {
        // Data event
        this.res.on('data', (chunk) => {
            this.emitEvent('response:data', {
                data: chunk,
                size: chunk.length
            });
        });

        // End event
        this.res.on('end', () => {
            this.emitEvent('response:end', {
                totalTime: Date.now() - this.startTime
            });
        });

        // Error event
        this.res.on('error', (error) => {
            this.emitEvent('response:error');
        });

        // Close event
        this.res.on('close', () => {
            this.emitEvent('response:close');
        });

        // Fire response start event
        this.emitEvent('response:start');
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

    json(data: any, status: number = 200) : boolean {
        if(this.responseData.sent || this.isClosed) {
            return true;
        }

        this.responseData.sent = true
        this.responseData.data = data
        this.responseData.method = "json"
        this.responseData.status = status
        return true
    }

    send(data: any, status: number = 200) : boolean {
        if(this.responseData.sent || this.isClosed) {
            return true;
        }

        this.responseData.sent = true
        this.responseData.data = data
        this.responseData.method = "send"
        this.responseData.status = status
        return true
    }

    dispatch() {
        if(this.isClosed) {
            return;
        }
        
        this.res.status(this.responseData.status)[this.responseData.method!](this.responseData.data)
        this.isClosed = true;
    }

    close() {
        if(this.isClosed) {
            return;
        }
        
        this.isClosed = true
        this.res.end();
    }

    isClosedYet() {
        return this.isClosed;
    }
}