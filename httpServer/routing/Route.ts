/*

Handle request comming to a specify route.
Middleware (Also the route handler itself) is an InjectableRequest
- Variable:
    - route: string
        - The route to handle
    - middleware: InjectableRequest
    - method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
*/
import InjectableRequest, { routeFunction } from "../request/InjectableRequest";
import Middlewares from "./Middleware";
import { RequestType } from "../request/RequestType";

interface Middleware {
    auth?: boolean,
    timeout?: boolean
}

export default class Route {
    private readonly path: string; // private readonly = const
    private readonly method: RequestType;
    private readonly handler: InjectableRequest;

    constructor(route: string, method: RequestType, middleware: Middleware = {}) {
        this.path = route;
        this.handler = new InjectableRequest();
        this.method = method;

        if(middleware.auth) Middlewares.auth(this)
        if(middleware.timeout) Middlewares.timeout(this)

        return this;
    }

    public route(fn: routeFunction) {
        this.handler.addRoute(fn);
        return this;
    }

    public getRoute() {
        return this.path;
    }
    
    public getHandler() {
        return this.handler.getHandler();
    }

    public getMethod(): RequestType {
        return this.method;
    }
}