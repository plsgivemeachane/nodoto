export type Permission = 'create' | 'read' | 'update' | 'delete';
export type Resource = 'posts' | 'users' | 'comments';

export interface RBACRule {
    resource: Resource;
    permissions: Permission[];
}

export interface Role {
    name: string;
    rules: RBACRule[];
    inherits?: string[]; // Role hierarchy: this role inherits all permissions from named roles
}

export interface User {
    id: string;
    username: string;
    roles: string[];
}
