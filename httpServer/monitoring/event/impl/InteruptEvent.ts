import NRequest from "../../../request/wrapper/NRequest";
import { RequestEvent } from "../../RequestEvent";
import Event from "../Event";


export default class InteruptEvent extends Event {
    name: string = 'request:interupt';
    timestamp: number = Date.now();

    constructor(data?: any) {
        super('request:interupt', data);
    }

    getReqestEvent(req: NRequest): RequestEvent {
        return {
            request: req,
            event: this,
            timestamp: this.timestamp
        };
    }
}