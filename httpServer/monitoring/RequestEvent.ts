import NRequest from "../request/wrapper/NRequest";
import NResponse from "../request/wrapper/NResponse";
import Event from "./event/Event";

/**
 * Interface representing a monitoring event for HTTP requests.
 * Contains essential information about the request including timing and client details.
 */
export interface RequestEvent {
    request: NRequest | NResponse;
    timestamp: number;
    event: string;
    data?: any
}
