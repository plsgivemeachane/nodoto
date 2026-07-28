import { logger } from "../../../../utils/winston";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { RequestFinishEventHandler } from "../handler/impl/RequestFinishEventHandler";

/**
 * Event fired when a request has been fully processed.
 * Logs request completion metrics: method, URL, duration, and outcome.
 */
export default class RequestFinishEvent extends Event<RequestFinishEventHandler> {
    name: string = 'request_finish';

    constructor(data?: any) {
        super(data);
    }

    getRequestId(event: RequestEvent): string {
        if (!event.request) {
            throw new Error("Request object is undefined in event");
        }
        return event.request.ID;
    }

    getOrCreateHandler(requestId: string): RequestFinishEventHandler {
        let handler = this.requestHandlers.get(requestId);
        if (!handler) {
            handler = new RequestFinishEventHandler(requestId);
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
            case "response:end":
            case "response:close":
                if (event.data) {
                    handler.setEventData(event.data);
                }
                handler.handleEnd(event);
                this.cleanupHandler(requestId);
                break;
            case "response:error":
            case "request:error":
                if (event.data) {
                    handler.setEventData(event.data);
                }
                handler.handleError(event);
                this.cleanupHandler(requestId);
                break;
        }
    }
}
