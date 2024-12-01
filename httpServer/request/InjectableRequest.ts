import * as express from 'express'
import { logger } from '../../utils/winston'

export type routeFunction = (req: express.Request, res: express.Response, next?: express.NextFunction) => (Promise<boolean> | boolean)
export type routeReturnFunction = (req: express.Request, res: express.Response, next?: express.NextFunction) => (Promise<void | any> | void | any)

export default class InjectableRequest {
    private routes: (routeFunction)[]

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

    public addRoutePossibleReturn(route: routeReturnFunction) {
        this.routes.push(async (req, res, next) => {
            try {
                const result = await Promise.resolve(route(req, res, next));
                if (typeof result === 'boolean') {
                    return result;
                } else {
                    return true;
                }
            } catch (error) {
                return false;
            }
        });
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
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            logger.verbose(`[HTTP] Incoming ${req.method} request to ${req.url} from ${req.ip}`)
            try {
                for(let route of this.routes) {
                    let result = route(req, res, next)
                    if(result && result instanceof Promise) {
                        result = await result;
                    }
                    if(!result) {
                        logger.verbose(`[HTTP] Request processing halted by middleware or handler`)
                        return;
                    }
                }
            } catch (error: any) {
                logger.error(`[HTTP] Failed to process ${req.method} request to ${req.url}: ${error.message}`);
            }
        }
    }

}