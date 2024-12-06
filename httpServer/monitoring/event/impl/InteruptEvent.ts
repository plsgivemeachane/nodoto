import { logger } from "../../../../utils/winston";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { AbstractRequestHandler } from "../handler/AbstractRequestHandler";


export default class InteruptEvent extends Event<AbstractRequestHandler> {
    getRequestId(event: RequestEvent): string {
        throw new Error("Method not implemented.");
    }
    getOrCreateHandler(requestId: string): AbstractRequestHandler {
        throw new Error("Method not implemented.");
    }
    cleanupHandler(requestId: string): void {
        throw new Error("Method not implemented.");
    }
    name: string = 'request:interupt';
    timestamp: number = Date.now();

    constructor(data?: any) {
        super(data);
    }

    public onEvent(event: RequestEvent): void {
        logger.debug("Request interrupted");
    }
}