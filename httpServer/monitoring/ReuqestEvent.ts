/**
 * Interface representing a monitoring event for HTTP requests.
 * Contains essential information about the request including timing and client details.
 */
export interface RequestEvent {
    /** The HTTP method used (GET, POST, etc.) */
    method: string;
    /** The requested URL path */
    url: string;
    /** Time taken to process the request in milliseconds */
    duration: number;
    /** Unix timestamp when the request was received */
    timestamp: number;
    /** Client's IP address */
    ip?: string;
    /** Request headers */
    headers: any;
}
