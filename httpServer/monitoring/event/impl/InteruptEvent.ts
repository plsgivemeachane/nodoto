import { logger } from "../../../../utils/winston";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { InteruptEventHandler } from "../handler/impl/InteruptEventHandler";

/**
 * Event fired when a request is interrupted (client disconnect).
 * Listens to request:close to detect premature disconnection.
 */
export default class InteruptEvent extends Event<InteruptEventHandler> {
    name: string = 'interupt';

    constructor(data?: any) {
        super(data);
    }

    getRequestId(event: RequestEvent): string {
        if (!event.request) {
            throw new Error("Request object is undefined in event");
        }
        return event.request.ID;
    }

    getOrCreateHandler(requestId: string): InteruptEventHandler {
        let handler = this.requestHandlers.get(requestId);
        if (!handler) {
            handler = new InteruptEventHandler(requestId);
            this.requestHandlers.set(requestId, handler);
        }
        return handler;
    }

    cleanupHandler(requestId: string): void {
        this.requestHandlers.delete(requestId);
    }

    public onEvent(event: RequestEvent): void {
        const requestId = this.getRequestId(event);
        const handler = this.getOrCreateHandler(requestId);

        switch(event.event) {
            case "request:start":
                handler.handleStart(event);
                break;
            case "request:close":
                // Client disconnected — check if response was already sent
                handler.handleInterrupt(event);
                this.cleanupHandler(requestId);
                break;
            case "response:end":
            case "response:close":
                // Response completed normally
                handler.handleEnd(event);
                this.cleanupHandler(requestId);
                break;
            case "response:error":
            case "request:error":
                handler.handleError(event);
                this.cleanupHandler(requestId);
                break;
        }
    }
}
