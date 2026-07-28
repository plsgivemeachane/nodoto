import { logger } from "../../../../../utils/winston";
import { RequestEvent } from "../../../RequestEvent";
import { AbstractRequestHandler } from "../AbstractRequestHandler";

/**
 * Handler for request interruption events (client disconnect).
 * Tracks whether a request was interrupted before the response was sent.
 */
export class InteruptEventHandler extends AbstractRequestHandler {
    private started: boolean = false;
    private finished: boolean = false;
    private interrupted: boolean = false;
    private startTime: number = 0;

    handleStart(event: RequestEvent): void {
        this.started = true;
        this.startTime = event.timestamp;
    }

    handleEnd(event: RequestEvent): void {
        this.finished = true;
    }

    handleError(event: RequestEvent): void {
        this.finished = true;
        this.cleanup();
    }

    /**
     * Called when the client disconnects before the response is sent.
     */
    handleInterrupt(event: RequestEvent): void {
        if (this.started && !this.finished) {
            this.interrupted = true;
            const duration = Date.now() - this.startTime;
            logger.warn(`[Interupt] Request ${this.requestId} interrupted (client disconnected) after ${duration}ms`);

            // Kill the request to stop middleware processing
            this.eventManager.kill(this.requestId, "Client Disconnected", 499);
        }
    }

    isInterrupted(): boolean {
        return this.interrupted;
    }

    private cleanup(): void {
    }
}
