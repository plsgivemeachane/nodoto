// Single entry point — import everything from here:
//   import { HTTPServer, Route, logger, Utils, AuthManager, ... } from 'nodoto';

export {
    HTTPServer,
    Route,
    RouteGroup,
    Middlewares,
    RequestType,
    RedisHelper,
    Validator,
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ErrorHandler,
    FileUpload,
    SessionManager,
    SwaggerManager,
    RateLimiter,
    ThreadPool,
    AuthManager
} from './httpServer';

export { default as EventManager } from './httpServer/monitoring/EventManager';
export type { RequestEvent } from './httpServer/monitoring/RequestEvent';
export { default as Queue } from './httpServer/queue/Queue';
export { RBACManager } from './httpServer/auth/rbac/RBACManager';
export { checkPermission } from './httpServer/auth/rbac/middleware';
export type { User, Role, Permission, Resource, RBACRule } from './httpServer/auth/rbac/types';

export { logger } from './utils/winston';
export { default as Utils } from './utils/utils';
export { default as Observable } from './utils/Observable';
