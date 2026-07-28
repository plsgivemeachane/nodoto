import { logger } from "../../../../../utils/winston";
import { RequestEvent } from "../../../RequestEvent";
import { AbstractRequestHandler } from "../AbstractRequestHandler";

/**
 * Handler for request finish events.
 * Logs request completion metrics including duration and outcome.
 */
export class RequestFinishEventHandler extends AbstractRequestHandler {
    private startTime: number = 0;
    private endTime: number = 0;
    private status: number | undefined;
    private method: string | undefined;
    private url: string | undefined;

    handleStart(event: RequestEvent): void {
        this.startTime = event.timestamp;
        const req = this.eventManager.getRequest(this.requestId);
        if (req) {
            this.method = req[0].getRequest().method;
            this.url = req[0].getRequest().url;
        }
    }

    handleEnd(event: RequestEvent): void {
        this.endTime = event.timestamp;
        this.logMetrics();
        this.cleanup();
    }

    handleError(event: RequestEvent): void {
        this.endTime = event.timestamp;
        this.logMetrics(true);
        this.cleanup();
    }

    private logMetrics(hasError: boolean = false): void {
        const duration = this.endTime - this.startTime;
        const status = hasError ? 'ERROR' : 'OK';

        logger.info(`[RequestFinish] ${this.method || '?'} ${this.url || '?'} - ${status} - ${duration}ms (id: ${this.requestId})`);

        if (this.event_data) {
            logger.debug(`[RequestFinish] Request ${this.requestId} data: ${JSON.stringify(this.event_data)}`);
        }
    }

    private event_data: any;

    setEventData(data: any): void {
        this.event_data = data;
    }

    private cleanup(): void {
    }
}
