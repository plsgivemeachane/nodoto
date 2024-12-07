import { Role, Permission, Resource, User } from './types';
import { logger } from '../../../utils/winston';

/**
 * The Role-Based Access Control (RBAC) manager.
 * 
 * This class manages roles and their associated permissions.
 * It provides methods to add roles and check if a user has a certain permission on a certain resource.
 * 
 * The manager is a singleton and can be accessed using the getInstance method.
 */
export class RBACManager {
    private static instance: RBACManager;
    private roles: Map<string, Role> = new Map();

    private constructor() {
        // Initialize with default roles
        this.addRole({
            name: 'admin',
            rules: [{
                resource: 'posts',
                permissions: ['create', 'read', 'update', 'delete']
            }, {
                resource: 'users',
                permissions: ['create', 'read', 'update', 'delete']
            }, {
                resource: 'comments',
                permissions: ['create', 'read', 'update', 'delete']
            }]
        });

        this.addRole({
            name: 'editor',
            rules: [{
                resource: 'posts',
                permissions: ['create', 'read', 'update']
            }, {
                resource: 'comments',
                permissions: ['create', 'read', 'update', 'delete']
            }]
        });

        this.addRole({
            name: 'viewer',
            rules: [{
                resource: 'posts',
                permissions: ['read']
            }, {
                resource: 'comments',
                permissions: ['read']
            }]
        });
    }

    /**
     * Returns the singleton instance of the RBACManager.
     * @returns The RBACManager instance.
     */
    public static getInstance(): RBACManager {
        if (!RBACManager.instance) {
            RBACManager.instance = new RBACManager();
        }
        return RBACManager.instance;
    }

    /**
     * Adds a role to the manager.
     * @param role The role to add.
     */
    public addRole(role: Role): void {
        this.roles.set(role.name, role);
        logger.info(`[RBAC] Added role: ${role.name}`);
    }

    /**
     * Checks if a user has the given permission on the given resource.
     * @param user The user to check.
     * @param permission The permission to check for.
     * @param resource The resource to check against.
     * @returns True if the user has the permission, false otherwise.
     */
    public can(user: User, permission: Permission, resource: Resource): boolean {
        for (const roleName of user.roles) {
            const role = this.roles.get(roleName);
            if (!role) continue;

            const rule = role.rules.find(r => r.resource === resource);
            if (rule && rule.permissions.includes(permission)) {
                return true;
            }
        }
        return false;
    }
}
