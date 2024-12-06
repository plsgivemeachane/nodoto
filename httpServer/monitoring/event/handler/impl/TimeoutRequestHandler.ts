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
            logger.debug(`Request ${this.requestId} timed out after ${this.timeout}ms`);
            // kill the request
            this.eventManager.kill(this.requestId, "Request Timeout", 408);
        }, this.timeout);
    }

    handleEnd(event: RequestEvent): void {
        // const duration = this.getDuration(event.timestamp);
        // logger.debug(`Request ${this.requestId} time ended. Duration: ${duration}ms`);
        this.cleanup();
    }

    handleError(event: RequestEvent): void {
        // const duration = this.getDuration(event.timestamp);
        // logger.debug(`Request ${this.requestId} ended with error. Duration: ${duration}ms`);
        this.cleanup();
    }

    private getDuration(endTimestamp: number): number {
        return endTimestamp - this.startTime;
    }

    private cleanup(): void {
        if (this.timerId) {
            clearTimeout(this.timerId);
        }
    }
}
