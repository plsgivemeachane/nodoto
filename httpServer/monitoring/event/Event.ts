import NRequest from "../../request/wrapper/NRequest";
import { RequestEvent } from "../RequestEvent";
import { AbstractRequestHandler } from "./handler/AbstractRequestHandler";

export default abstract class Event<Handler extends AbstractRequestHandler> {
    name: string = "Event"
    timestamp: number = Date.now()
    data?: any
    protected requestHandlers: Map<string, Handler> = new Map()

    constructor(data?: any) {
        this.data = data
        this.onEvent = this.onEvent.bind(this);
    }
    
    abstract getRequestId(event: RequestEvent): string
        // return (event.request as NRequest).ID;
    // }

    abstract getOrCreateHandler(requestId: string): Handler 
    //     return this.requestHandlers.get(requestId)!;
    // }

    abstract cleanupHandler(requestId: string): void 
    //     this.requestHandlers.delete(requestId);
    // }

    public onEvent(event: RequestEvent): void {}

    public static getEventName(): string {
        return this.name;
    }
       
}