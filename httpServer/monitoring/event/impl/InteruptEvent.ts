import { logger } from "../../../../utils/winston";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";
import { AbstractRequestHandler } from "../handler/AbstractRequestHandler";


export default class InteruptEvent extends Event<AbstractRequestHandler> {
    name: string = 'request:interupt';
    timestamp: number = Date.now();

    constructor(data?: any) {
        super(data);
    }

    public onEvent(event: RequestEvent): void {
        logger.debug("Request interrupted");
    }
}