import { logger } from "../../../../../utils/winston";
import { HTTPServer } from "../../../../HTTPServer";
import { RequestEvent } from "../../../RequestEvent";
import { AbstractRequestHandler } from "../AbstractRequestHandler";

export class TimeoutRequestHandler extends AbstractRequestHandler {
    private startTime: number = Date.now();
    private readonly timeout: number = HTTPServer.config.timeout || 0;
    private timerId: NodeJS.Timeout | undefined;

    constructor(requestId: string) {
        super(requestId);
    }

    handleStart(event: RequestEvent): void {
        this.startTime = event.timestamp;
        logger.debug(`Request ${this.requestId} time started`);

        // Start a timeout timer
        this.timerId = setTimeout(() => {
            const req = this.eventManager.getRequest(this.requestId);
            if(req![1].isClosedYet()) {
                logger.debug(`Request ${this.requestId} already closed`);
                return;
            }

            logger.debug(`Request ${this.requestId} timed out after ${this.timeout}ms`);
            // kill the request
            this.eventManager.kill(this.requestId, "Request Timeout", 408);
        }, this.timeout);
    }

    handleEnd(event: RequestEvent): void {
        this.cleanup();
    }

    handleError(event: RequestEvent): void {
        this.cleanup();
    }
    
    private cleanup(): void {
        logger.debug(`Request ${this.requestId} cleanup`);
        clearTimeout(this.timerId);
    }
}
