import * as express from 'express'
import { logger } from '../../utils/winston'
import NRequest from './wrapper/NRequest'
import NResponse from './wrapper/NResponse'
import EventManager from '../monitoring/EventManager'
import { RequestEvent } from '../monitoring/RequestEvent'

/**
 * A function that takes an Express request and response object, and performs asynchronous operations.
 * The function is expected to return a Promise that resolves when the route is finished.
 * If the route returns a rejected Promise, the error is logged to the console but the request is not aborted.
 */
export type routeFunction = (req: NRequest, res: NResponse) => (Promise<boolean> | boolean)

export default class InjectableRequest {
    private routes: (routeFunction)[]
    private readonly eventManager = EventManager.getInstance();
    // private readonly resMap: Map<string, NResponse> = new Map();
    // private readonly reqMap: Map<string, NRequest> = new Map();

    constructor() {
        this.routes = []
    }

    /**
     * Adds an asynchronous route to the list of routes.
     * The route is executed sequentially after all previously added routes.
     * The route is expected to return a Promise that resolves when the route is finished.
     * If the route returns a rejected Promise, the error is logged to the console but the request is not aborted.
     *
     * @param route - A function that takes an Express request and response object, and performs asynchronous operations.
     */
    public addRoute(route: routeFunction) {
        this.routes.push(route)
        return this
    }

    /**
     * Returns a handler function that processes incoming HTTP requests.
     * The handler logs the request method, URL, and IP address, then sequentially executes all registered routes.
     * Each route is awaited to ensure proper asynchronous operations.
     *
     * @returns An asynchronous function that takes an Express request and response object, logging the request details and executing all routes.
     */
    public getHandler() {
        return async (req: express.Request, res: express.Response) => {
            logger.verbose(`[HTTP] Incoming ${req.method} request to ${req.url} from ${req.ip}`)
            try {
                logger.debug(`[HTTP] Processing over ${this.routes.length} routes`)
                var nreq = new NRequest(req)
                var nres = new NResponse(res)
                // Register event.
                // this.eventManager.registerListener("response:kill", (event: RequestEvent) => {
                //     // Dispatch the response
                //     if(event.request.ID === nres.ID) {
                //         nres.close();
                //     }
                // });

                this.eventManager.registerRequest(nreq, nres);

                for(let route of this.routes) {
                    if(nres.isClosedYet()) {
                        //* DO NOT CONTINUE PROCESSING
                        logger.verbose(`[HTTP] Request processing halted by middleware or handler`)
                        break;
                    }

                    let result = await route(nreq, nres);
                    if(typeof result !== 'boolean') {
                        throw new Error("[HTTP] Route must return a boolean value")
                    }
                    if(!result) {
                        // logger.verbose(`[HTTP] Request processing halted by middleware or handler`)
                        break;
                    }
                }

                // Finish routing. send the response
                logger.info(`[HTTP] Finished processing ${req.method} request to ${req.url}`)
                nres.dispatch(); // Fire the response
            } catch (error: any) {
                logger.error(`[HTTP] Failed to process ${req.method} request to ${req.url}: ${error.message}`);
            }
        }
    }

}