import { logger } from "../../../../utils/winston";
import NRequest from "../../../request/wrapper/NRequest";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { AbstractRequestHandler } from "../handler/AbstractRequestHandler";

export default class RequestEventLogger extends Event<AbstractRequestHandler> {
    getRequestId(event: RequestEvent): string {
        throw new Error("Method not implemented.");
    }
    getOrCreateHandler(requestId: string): AbstractRequestHandler {
        throw new Error("Method not implemented.");
    }
    cleanupHandler(requestId: string): void {
        throw new Error("Method not implemented.");
    }
    name: string = 'request_logger';

    constructor(data?: any) {
        super(data);
    }

    public onEvent(event: RequestEvent): void {
        logger.debug(`Request ${event.request.ID} - ${event.event}`);
    }
}