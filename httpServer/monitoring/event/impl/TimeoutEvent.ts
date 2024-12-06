import { logger } from "../../../../utils/winston";
import NRequest from "../../../request/wrapper/NRequest";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { AbstractRequestHandler } from "../handler/AbstractRequestHandler";
import { TimeoutRequestHandler } from "../handler/impl/TimeoutRequestHandler";

export default class TimeoutEvent extends Event<TimeoutRequestHandler> {
    name: string = 'timeout';
    constructor(data?: any) {
        super(data);
    }

    getRequestId(event: RequestEvent): string {
        if (!event.request) {
            throw new Error("Request object is undefined in event");
        }
        return event.request.ID;
    }

    getOrCreateHandler(requestId: string): TimeoutRequestHandler {
        let handler = this.requestHandlers.get(requestId);
        if (!handler) {
            handler = new TimeoutRequestHandler(requestId);
            this.requestHandlers.set(requestId, handler);
        }
        return handler;
    }

    cleanupHandler(requestId: string): void {
        this.requestHandlers.delete(requestId);
    }

    public onEvent(event: RequestEvent): void {
        // console.dir(event.request.ID);
        const requestId = this.getRequestId(event);
        const handler = this.getOrCreateHandler(requestId);

        switch(event.event) {
            case "request:start":
                handler.handleStart(event);
                break;
            case "response:end":
            case "response:close":
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