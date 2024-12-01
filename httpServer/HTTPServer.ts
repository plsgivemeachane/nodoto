import Route from "./routing/Route";
import express from 'express'
import http from 'http'
import { logger } from "../utils/winston";
import RouteGroup from "./routing/RouteGroup";
import Observable from "../utils/Observable";
import dotenv from "dotenv";
dotenv.config();

export class HTTPServer {
    private readonly routes: (Route | RouteGroup)[];
    public port: number;

    private static readonly observable: Observable<string> = new Observable<string>();

    constructor() {
        this.routes = [];
        this.port = process.env.API_SERVER_PORT ? parseInt(process.env.API_SERVER_PORT) : 8080;
    }

    public setLoggerLevel(level: string) {
        logger.level = level;
    }

    public addRoute(route: Route | RouteGroup) {
        this.routes.push(route);
    }

    public start() {
        if(this.routes.length == 0) {
            throw new Error("[HTTPServer] Cannot start server: No routes have been configured. Please add at least one route using addRoute() before starting the server.")
        }

        const app = express();
        const server = http.createServer(app);
        // Middleware
        app.use(express.json());

        const root = new RouteGroup("/")
        for(let route of this.routes) {
            root.route(route)
        }

        app.use(root.getPath(), root.getRouter())

        server.listen(this.port, () => {
            logger.info(`[Server] HTTP server started and listening on port ${this.port}`)
        });

    }

    public static getObservable(): Observable<string> {
        return this.observable;
    }
}