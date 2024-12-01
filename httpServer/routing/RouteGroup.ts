import { logger } from "../../utils/winston";
import Route from "./Route";
import express from "express";

export default class RouteGroup {
    private readonly router: express.Router;
    private readonly path: string;

    constructor(path: string) {
        this.path = path;
        this.router = express.Router();
        return this
    }

    public route(...routes: (Route | RouteGroup)[]) { 
        for(let route of routes) {
            if(route instanceof Route) {
                logger.verbose(`[Router] Registering endpoint: ${route.getMethod().toUpperCase()} ${this.path}${route.getRoute()}`)
                this.router[route.getMethod()](route.getRoute(), route.getHandler())
            } else {
                logger.verbose(`[Router] Mounting route group at path: ${this.path}${route.getPath()}`)
                this.router.use(route.getPath(), route.getRouter())
            }
        }
        return this
    }

    public getRouter() {
        return this.router;
    }

    public getPath() {
        return this.path;
    }
}