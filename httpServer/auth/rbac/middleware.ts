import { RBACManager } from './RBACManager';
import { Permission, Resource, User } from './types';
import { logger } from '../../../utils/winston';
import NRequest from '../../request/wrapper/NRequest';
import NResponse from '../../request/wrapper/NResponse';

export const checkPermission = (permission: Permission, resource: Resource) => {
    return (req: NRequest, res: NResponse) => {
        // TODO In a real application, you would get the user from the session/token
        const user = req.getUser();
        
        if (!user) {
            logger.warn(`[RBAC] No user found in request`);
            return res.json({ error: 'Unauthorized' }, 401);
        }

        const rbac = RBACManager.getInstance();
        if (rbac.can(user, permission, resource)) {
            return true;
        } else {
            logger.warn(`[RBAC] User ${user.username} denied ${permission} access to ${resource}`);
            return res.json({ error: 'Forbidden' }, 403);
        }
    };
};
