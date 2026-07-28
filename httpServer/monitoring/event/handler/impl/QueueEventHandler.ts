import { logger } from "../../../../../utils/winston";
import { HTTPServer } from "../../../../HTTPServer";
import Queue from "../../../../queue/Queue";
import type NRequest from "../../../../request/wrapper/NRequest";
import { RequestEvent } from "../../../RequestEvent";
import { AbstractRequestHandler } from "../AbstractRequestHandler";

export class QueueEventHandler<NRequest> extends AbstractRequestHandler {

    queue: Queue<NRequest>;

    constructor(requestId: string, queue: Queue<NRequest>) {
        super(requestId);
        this.queue = queue;
    }

    handleStart(event: RequestEvent): void {
        if(!('isClosedYet' in event.request)) {
            // Handle only request event
            if(this.queue.peek(10, event.request)) {
                // Drop this request
                logger.debug(`Request ${this.requestId} duplicate to many times`);
                this.eventManager.kill(this.requestId);
            }
        }
    }

    handleEnd(event: RequestEvent): void {
    }

    handleError(event: RequestEvent): void {
    }
    
    private cleanup(): void {
    }
}
