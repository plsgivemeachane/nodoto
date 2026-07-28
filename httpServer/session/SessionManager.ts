import session from 'express-session';
import { RequestHandler } from 'express';
import { logger } from '../../utils/winston';

export interface SessionOptions {
    secret: string;
    resave?: boolean;
    saveUninitialized?: boolean;
    cookie?: {
        secure?: boolean;
        httpOnly?: boolean;
        maxAge?: number;
        sameSite?: 'strict' | 'lax' | 'none';
    };
    store?: session.Store;
}

export class SessionManager {
    private static instance: SessionManager;
    private middleware: RequestHandler | null = null;

    private constructor() {}

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    public init(options: SessionOptions): RequestHandler {
        const defaultOptions: session.SessionOptions = {
            secret: options.secret,
            resave: options.resave ?? false,
            saveUninitialized: options.saveUninitialized ?? false,
            cookie: {
                secure: options.cookie?.secure ?? process.env.NODE_ENV === 'production',
                httpOnly: options.cookie?.httpOnly ?? true,
                maxAge: options.cookie?.maxAge ?? 24 * 60 * 60 * 1000,
                sameSite: options.cookie?.sameSite ?? 'lax'
            },
            store: options.store
        };

        this.middleware = session(defaultOptions);
        logger.info('[Session] Session manager initialized');
        return this.middleware;
    }

    public getMiddleware(): RequestHandler {
        if (!this.middleware) {
            throw new Error('[Session] Session manager not initialized. Call init() first.');
        }
        return this.middleware;
    }
}

export default SessionManager;
