import NRequest from "../../../request/wrapper/NRequest";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";

export default class TimeoutEvent extends Event {
    name: string = 'timeout';
    timestamp: number = Date.now();

    constructor(data?: any) {
        super("timeout", data);
    }

    getReqestEvent(req: NRequest): RequestEvent {
        return {
            request: req,
            event: this,
            timestamp: this.timestamp
        };
    }
}