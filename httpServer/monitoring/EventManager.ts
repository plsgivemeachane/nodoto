import { RequestEvent } from "./RequestEvent";
import { EventEmitter } from "events";

export default class EventManager {
    private static instance: EventManager;
    private eventEmitter: EventEmitter;

    private constructor() {
        this.eventEmitter = new EventEmitter();
    }

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public on(eventName: string, listener: (event: RequestEvent) => void): void {
        this.eventEmitter.on(eventName, listener);
    }

    public once(eventName: string, listener: (event: RequestEvent) => void): void {
        this.eventEmitter.once(eventName, listener);
    }

    public emit(eventName: string, event: RequestEvent): void {
        this.eventEmitter.emit(eventName, event);
    }

    public removeListener(eventName: string, listener: (event: RequestEvent) => void): void {
        this.eventEmitter.removeListener(eventName, listener);
    }

    public removeAllListeners(eventName?: string): void {
        this.eventEmitter.removeAllListeners(eventName);
    }
}