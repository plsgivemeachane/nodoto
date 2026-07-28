import { logger } from "../../utils/winston";
import NResponse from '../request/wrapper/NResponse';
import NRequest from '../request/wrapper/NRequest';
import type { routeFunction } from '../request/InjectableRequest';
import { checkPermission } from '../auth/rbac/middleware';
import { User } from '../auth/rbac/types';
import { AuthManager } from '../auth/AuthManager';
import EventManager from '../monitoring/EventManager';
import TimeoutEvent from '../monitoring/event/impl/TimeoutEvent';

export default class Middlewares {

    // Default auth middleware: JWT verification with automatic user context setup.
    // Uses AuthManager which handles bcrypt password hashing and JWT token generation.
    public static auth: routeFunction = AuthManager.jwtAuth();

    public static rbacCheckPerm = checkPermission;

    public static timeout() {
        return EventManager.getInstance().registerListenerForRequest(new TimeoutEvent().onEvent);
    }
}