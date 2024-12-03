import NRequest from "../request/wrapper/NRequest";
import Event from "./event/Event";

/**
 * Interface representing a monitoring event for HTTP requests.
 * Contains essential information about the request including timing and client details.
 */
export interface RequestEvent {
    request: NRequest;
    timestamp: number;
    event: Event;
}
