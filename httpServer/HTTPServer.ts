import Route from "./routing/Route";
import express from 'express'
import http from 'http'
import { logger } from "../utils/winston";
import RouteGroup from "./routing/RouteGroup";
import Observable from "../utils/Observable";
import dotenv from "dotenv";
import HTTPServerConfig from "./HTTPConfig";
import cors from 'cors'

// Core utilities
import Utils from "../utils/utils";

// Request types
import { RequestType } from "./request/RequestType";
import Middlewares from "./routing/Middleware";

// Database
import RedisHelper from "./databases/RedisHelper";

// Validation
import { Validator } from "./validation/Validator";

// Errors
import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, RateLimitError } from "./errors/AppError";
import ErrorHandler from "./errors/ErrorHandler";

// Upload
import FileUpload from "./upload/FileUpload";

// Session
import SessionManager from "./session/SessionManager";

// Docs
import SwaggerManager from "./docs/SwaggerManager";

// Middleware
import RateLimiter from "./middleware/RateLimiter";

// Threading
import ThreadPool from "./threading/ThreadPool";

// Auth
import AuthManager from "./auth/AuthManager";

// Monitoring
import EventManager from "./monitoring/EventManager";

// Auth RBAC
import { RBACManager } from "./auth/rbac/RBACManager";
import { checkPermission } from "./auth/rbac/middleware";

// Queue
import Queue from "./queue/Queue";

dotenv.config();

export class HTTPServer {
    private readonly routes: (Route | RouteGroup)[];
    public port: number;
    private static instance: HTTPServer;
    private static readonly observable: Observable<string> = new Observable<string>();
    public static config: HTTPServerConfig;

    // === Static accessors — one import for everything ===

    /** Logger instance (winston) */
    public static readonly Logger = logger;

    /** Utility functions (snowflake ID, sleep, defer) */
    public static readonly Utils = Utils;

    /** Route class for defining endpoints */
    public static readonly Route = Route;

    /** RouteGroup class for grouping routes */
    public static readonly RouteGroup = RouteGroup;

    /** Built-in middleware (auth, timeout, rbac) */
    public static readonly Middlewares = Middlewares;

    /** HTTP request methods enum */
    public static readonly RequestType = RequestType;

    /** Redis helper singleton */
    public static readonly Redis = RedisHelper;

    /** Joi validation middleware */
    public static readonly Validator = Validator;

    /** Error classes */
    public static readonly AppError = AppError;
    public static readonly ValidationError = ValidationError;
    public static readonly UnauthorizedError = UnauthorizedError;
    public static readonly ForbiddenError = ForbiddenError;
    public static readonly NotFoundError = NotFoundError;
    public static readonly ConflictError = ConflictError;
    public static readonly RateLimitError = RateLimitError;
    public static readonly ErrorHandler = ErrorHandler;

    /** File upload middleware (Multer) */
    public static readonly FileUpload = FileUpload;

    /** Session manager */
    public static readonly Session = SessionManager;

    /** Swagger documentation manager */
    public static readonly Swagger = SwaggerManager;

    /** Rate limiting middleware */
    public static readonly RateLimiter = RateLimiter;

    /** Worker thread pool */
    public static readonly ThreadPool = ThreadPool;

    /** Auth manager (bcrypt + JWT) */
    public static readonly Auth = AuthManager;

    /** Event manager for request monitoring */
    public static readonly Events = EventManager;

    /** RBAC manager for role-based access control */
    public static readonly RBAC = RBACManager;

    /** RBAC permission check middleware factory */
    public static readonly checkPermission = checkPermission;

    /** Persistent queue for request deduplication */
    public static readonly Queue = Queue;

    private constructor(config: HTTPServerConfig) {
        this.routes = [];
        this.port = config.port ? config.port : 8080;
        HTTPServer.config = config;
        this.setLoggerLevel(config.logLevel ? config.logLevel : "info")
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

    /**
     * Starts the HTTP server.
     *
     * The server will listen on the configured port and will serve all configured routes.
     * If no routes have been configured, an error will be thrown.
     */
    public start() {
        if(this.routes.length == 0) {
            throw new Error("[HTTPServer] Cannot start server: No routes have been configured. Please add at least one route using addRoute() before starting the server.")
        }

        const app = express();
        const server = http.createServer(app);
        // Middleware
        if(HTTPServer.config.useJsonParser) {
            logger.info(`[HTTPServer] Enabling JSON parser.`)
            app.use(express.json());
        }
        if(HTTPServer.config.useUrlParser) {
            logger.info(`[HTTPServer] Enabling URL-encoded data parser.`)
            app.use(express.urlencoded({ extended: true }));
        }
        if(HTTPServer.config.corsSetting) {
            logger.info(`[HTTPServer] Enabling CORS.`)
            app.use(cors(HTTPServer.config.corsSetting));
        }

        const root = new RouteGroup("/")
        for(let route of this.routes) {
            root.route(route)
        }

        app.use(root.getPath(), root.getRouter())

        app.use((_, res) => {
            logger.warn(`[HTTPServer] Accessing non-existent route: ${res.req.url}`)
            res.status(404).send("Not found");
        });

        server.listen(this.port, () => {
            logger.info(`[Server] HTTP server started and listening on port ${this.port}`)
        });
    }

    public static getObservable(): Observable<string> {
        return this.observable;
    }
}
