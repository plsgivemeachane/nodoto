import NRequest from "../../../request/wrapper/NRequest";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";

export default class RequestFinishEvent extends Event {
    name: string = 'request_finish';
    timestamp: number = Date.now();

    constructor(data?: any) {
        super('request_finish', data);
    }

    getReqestEvent(req: NRequest): RequestEvent {
        return {
            request: req,
            event: this,
            timestamp: this.timestamp
        };
    }
}