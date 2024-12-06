import EventManager from "../../EventManager";
import { RequestEvent } from "../../RequestEvent";

export abstract class AbstractRequestHandler {
    protected requestId: string;
    protected readonly eventManager = EventManager.getInstance();

    constructor(requestId: string) {
        this.requestId = requestId;
    }

    abstract handleStart(event: RequestEvent): void;
    abstract handleEnd(event: RequestEvent): void;
    abstract handleError(event: RequestEvent): void;

    getRequestId(): string {
        return this.requestId;
    }
}
