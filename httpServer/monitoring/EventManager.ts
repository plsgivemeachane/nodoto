import Observable from "../../utils/Observable";
import { logger } from "../../utils/winston";
import { routeFunction } from "../request/InjectableRequest";
import NRequest from "../request/wrapper/NRequest";
import NResponse from "../request/wrapper/NResponse";
import RequestEventLogger from "./event/impl/RequestFinishEvent";
import TimeoutEvent from "./event/impl/TimeoutEvent";
import { RequestEvent } from "./RequestEvent";

export default class EventManager {
    private static instance: EventManager;
    private readonly listeners: Map<string, Observable<RequestEvent>> = new Map();
    private readonly requestMap: Map<string, [NRequest, NResponse]> = new Map();
    // private readonly responseMap: Map<string, NResponse> = new Map();

    private constructor() {
        this.listeners = new Map();
        // Register default events
        // Request events
        this.registerEvent("request:start");
        this.registerEvent("request:data");
        this.registerEvent("request:end");
        this.registerEvent("request:error");
        this.registerEvent("request:close");

        // Response events
        this.registerEvent("response:start");
        this.registerEvent("response:data");
        this.registerEvent("response:end");
        this.registerEvent("response:error");
        this.registerEvent("response:close");
        // this.registerEvent("response:kill");

        // Register listeners
        // this.registerAllListener(new RequestEventLogger().onEvent); // Register all event for this listeners
        // this.registerAllListener(new TimeoutEvent().onEvent);


        // Register cleanup listeners
        this.registerListener("response:close", (event: RequestEvent) => this.cleanupRequest(event.request as NRequest));
        this.registerListener("response:error", (event: RequestEvent) => this.cleanupRequest(event.request as NRequest));
    }

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public registerAllListener(listener: (event: RequestEvent) => void) {
        for (const event of this.listeners.keys()) {
            this.registerListener(event, listener);
        }
    }

    public registerListenerForRequest(listener: (event: RequestEvent) => void) {
        return ((req, res) => {
            this.registerAllListener((event: RequestEvent) => {
                if(event.request.ID === req.ID) {
                    listener(event);
                }
            })

            return true
        }) as routeFunction
    }

    public getRequest(reqId: string): [NRequest, NResponse] | undefined {
        return this.requestMap.get(reqId);
    }

    public kill(reqId: string, reason: string = "Internal Server Error", status: number = 500): void {
        const requestPair = this.requestMap.get(reqId);
        if (requestPair) {
            const [_, response] = requestPair;
            if(response.isClosedYet()) {
                logger.error(`Request ${reqId} closed`);
                return
            }

            logger.warn(`Request ${reqId} killed with reason: ${reason} and status: ${status}`);
            response.send({ error: reason, status: status }, status);
            response.dispatch();
            this.requestMap.delete(reqId);
        } else {
            logger.error(`Request ${reqId} not found`);
        }
    }

    public registerRequest(req: NRequest, res: NResponse): void {   
        // logger.verbose(`[EventManager] Registering request ${req.ID} and response ${res.ID}`);
        this.requestMap.set(req.ID, [req, res]);
    }

    public cleanupRequest(req: NRequest): void {
        this.requestMap.delete(req.ID);
    }

    private registerEvent(eventName: string) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Observable<RequestEvent>());
        }
    }

    public registerListener(eventName: string, listener: (event: RequestEvent) => void) : void {
        if(!this.listeners.has(eventName)) {
            throw new Error(`Event ${eventName} not found`);
        }
        this.listeners.get(eventName)!.subscribe(listener);
    }

    public emit(eventName: string, event: RequestEvent): void {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName)?.notify(event);
            return;
        }

        throw new Error(`Event ${eventName} not found`);
    }

}