import { RBACManager } from '../httpServer/auth/rbac/RBACManager';
import { User } from '../httpServer/auth/rbac/types';

describe('RBACManager', () => {
    let rbac: RBACManager;

    beforeEach(() => {
        rbac = RBACManager.getInstance();
    });

    const adminUser: User = {
        id: '1',
        username: 'admin',
        roles: ['admin']
    };

    const editorUser: User = {
        id: '2',
        username: 'editor',
        roles: ['editor']
    };

    const viewerUser: User = {
        id: '3',
        username: 'viewer',
        roles: ['viewer']
    };

    describe('can()', () => {
        it('should allow admin to create posts', () => {
            expect(rbac.can(adminUser, 'create', 'posts')).toBe(true);
        });

        it('should allow admin to delete users', () => {
            expect(rbac.can(adminUser, 'delete', 'users')).toBe(true);
        });

        it('should allow editor to create posts', () => {
            expect(rbac.can(editorUser, 'create', 'posts')).toBe(true);
        });

        it('should deny editor from deleting posts', () => {
            expect(rbac.can(editorUser, 'delete', 'posts')).toBe(false);
        });

        it('should allow viewer to read posts', () => {
            expect(rbac.can(viewerUser, 'read', 'posts')).toBe(true);
        });

        it('should deny viewer from creating posts', () => {
            expect(rbac.can(viewerUser, 'create', 'posts')).toBe(false);
        });

        it('should deny viewer from accessing users resource', () => {
            expect(rbac.can(viewerUser, 'read', 'users')).toBe(false);
        });
    });

    describe('addRole()', () => {
        it('should add a custom role', () => {
            rbac.addRole({
                name: 'moderator',
                rules: [{
                    resource: 'comments',
                    permissions: ['create', 'read', 'update', 'delete']
                }]
            });

            const modUser: User = {
                id: '4',
                username: 'mod',
                roles: ['moderator']
            };

            expect(rbac.can(modUser, 'delete', 'comments')).toBe(true);
            expect(rbac.can(modUser, 'read', 'posts')).toBe(false);
        });
    });

    describe('multiple roles', () => {
        it('should check all roles for permission', () => {
            const multiRoleUser: User = {
                id: '5',
                username: 'multi',
                roles: ['viewer', 'editor']
            };

            expect(rbac.can(multiRoleUser, 'read', 'posts')).toBe(true);
            expect(rbac.can(multiRoleUser, 'update', 'posts')).toBe(true);
        });
    });
});
