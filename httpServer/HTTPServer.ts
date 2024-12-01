import Route from "./routing/Route";
import express from 'express'
import http from 'http'
import { logger } from "../utils/winston";
import RouteGroup from "./routing/RouteGroup";
import Observable from "../utils/Observable";
import dotenv from "dotenv";
import HTTPServerConfig from "./HTTPConfig";
import cors from 'cors'
dotenv.config();

export class HTTPServer {
    private readonly routes: (Route | RouteGroup)[];
    public port: number;
    private static instance: HTTPServer;
    private static readonly observable: Observable<string> = new Observable<string>();
    private readonly config: HTTPServerConfig;
    private constructor(config: HTTPServerConfig) {
        this.routes = [];
        this.port = config.port ? config.port : 8080;
        this.config = config;
    }


    public static init(config: HTTPServerConfig): HTTPServer {
        HTTPServer.instance = new HTTPServer(config);
        return HTTPServer.instance;
    }

    public static getInstance(): HTTPServer {
        if (!HTTPServer.instance) {
            throw new Error("[HTTPServer] HTTP server has not been initialized. Please call HTTPServer.init() first.");
        }
        return HTTPServer.instance;
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
        if(this.config.useJsonParser) app.use(express.json());
        if(this.config.useUrlParser) app.use(express.urlencoded({ extended: true }));
        if(this.config.corsSetting) app.use(cors(this.config.corsSetting));

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