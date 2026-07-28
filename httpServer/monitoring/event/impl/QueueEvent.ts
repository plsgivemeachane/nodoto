import Queue from "../../../queue/Queue";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { QueueEventHandler } from "../handler/impl/QueueEventHandler";

export default class QueueEvent<NRequest> extends Event<QueueEventHandler<NRequest>> {
    name: string = 'timeout';
    queue: Queue<NRequest>;

    constructor(queueFile: string,data?: any) {
        super(data);
        this.queue = new Queue<NRequest>(queueFile);
    }

    getRequestId(event: RequestEvent): string {
        if (!event.request) {
            throw new Error("Request object is undefined in event");
        }
        return event.request.ID;
    }

    getOrCreateHandler(requestId: string): QueueEventHandler<NRequest> {
        let handler = this.requestHandlers.get(requestId);
        if (!handler) {
            handler = new QueueEventHandler<NRequest>(requestId, this.queue);
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