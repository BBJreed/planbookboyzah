/**
 * Role-Based Access Control (RBAC) Service
 * Provides granular permission management for team collaboration
 */

export type Permission = 
  | 'calendar:view'
  | 'calendar:create'
  | 'calendar:edit'
  | 'calendar:delete'
  | 'tasks:view'
  | 'tasks:create'
  | 'tasks:edit'
  | 'tasks:delete'
  | 'stickers:view'
  | 'stickers:create'
  | 'stickers:edit'
  | 'stickers:delete'
  | 'workflow:view'
  | 'workflow:create'
  | 'workflow:edit'
  | 'workflow:delete'
  | 'reports:view'
  | 'reports:export'
  | 'settings:view'
  | 'settings:create'
  | 'settings:edit'
  | 'users:invite'
  | 'users:remove'
  | 'users:permissions';

export type Role = 
  | 'admin'
  | 'manager'
  | 'member'
  | 'viewer'
  | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export class RBAC {
  private static instance: RBAC;
  private roles: Map<Role, Permission[]> = new Map();
  private users: Map<string, User> = new Map();

  private constructor() {
    this.initializeRoles();
  }

  static getInstance(): RBAC {
    if (!RBAC.instance) {
      RBAC.instance = new RBAC();
    }
    return RBAC.instance;
  }

  /**
   * Initialize default roles and their permissions
   */
  private initializeRoles(): void {
    // Admin - Full access to everything
    this.roles.set('admin', [
      'calendar:view', 'calendar:create', 'calendar:edit', 'calendar:delete',
      'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete',
      'stickers:view', 'stickers:create', 'stickers:edit', 'stickers:delete',
      'workflow:view', 'workflow:create', 'workflow:edit', 'workflow:delete',
      'reports:view', 'reports:export',
      'settings:view', 'settings:edit',
      'users:invite', 'users:remove', 'users:permissions'
    ]);

    // Manager - Can manage calendar, tasks, and stickers, but not users
    this.roles.set('manager', [
      'calendar:view', 'calendar:create', 'calendar:edit', 'calendar:delete',
      'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete',
      'stickers:view', 'stickers:create', 'stickers:edit', 'stickers:delete',
      'workflow:view', 'workflow:create', 'workflow:edit',
      'reports:view', 'reports:export'
    ]);

    // Member - Can view and create, but limited editing
    this.roles.set('member', [
      'calendar:view', 'calendar:create',
      'tasks:view', 'tasks:create', 'tasks:edit',
      'stickers:view', 'stickers:create',
      'reports:view'
    ]);

    // Viewer - Read-only access
    this.roles.set('viewer', [
      'calendar:view',
      'tasks:view',
      'stickers:view',
      'reports:view'
    ]);

    // Guest - Limited access
    this.roles.set('guest', [
      'calendar:view',
      'tasks:view'
    ]);
  }

  /**
   * Add a new user
   */
  addUser(user: Omit<User, 'permissions'>): User {
    const permissions = this.roles.get(user.role) || [];
    const newUser: User = { ...user, permissions };
    this.users.set(user.id, newUser);
    console.log(`User added: ${user.name} (${user.role})`);
    return newUser;
  }

  /**
   * Remove a user
   */
  removeUser(userId: string): boolean {
    const result = this.users.delete(userId);
    if (result) {
      console.log(`User removed: ${userId}`);
    }
    return result;
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, newRole: Role): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`User not found: ${userId}`);
      return false;
    }

    const permissions = this.roles.get(newRole) || [];
    user.role = newRole;
    user.permissions = permissions;
    
    console.log(`User role updated: ${user.name} -> ${newRole}`);
    return true;
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`User not found: ${userId}`);
      return false;
    }

    return user.permissions.includes(permission);
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(userId: string, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userId, permission));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userId: string, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userId, permission));
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Get all users
   */
  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: Role): User[] {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  /**
   * Grant a specific permission to a user (beyond their role)
   */
  grantPermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`User not found: ${userId}`);
      return false;
    }

    if (!user.permissions.includes(permission)) {
      user.permissions.push(permission);
      console.log(`Permission granted to ${user.name}: ${permission}`);
    }

    return true;
  }

  /**
   * Revoke a specific permission from a user
   */
  revokePermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`User not found: ${userId}`);
      return false;
    }

    const index = user.permissions.indexOf(permission);
    if (index > -1) {
      user.permissions.splice(index, 1);
      console.log(`Permission revoked from ${user.name}: ${permission}`);
      return true;
    }

    return false;
  }

  /**
   * Get role permissions
   */
  getRolePermissions(role: Role): Permission[] {
    return this.roles.get(role) || [];
  }

  /**
   * Create a custom role
   */
  createCustomRole(role: Role, permissions: Permission[]): void {
    this.roles.set(role, permissions);
    console.log(`Custom role created: ${role}`);
  }

  /**
   * Check if user can perform an action on a resource
   */
  can(userId: string, action: 'view' | 'create' | 'edit' | 'delete', resource: 'calendar' | 'tasks' | 'stickers' | 'workflow' | 'reports' | 'settings' | 'users'): boolean {
    // Special handling for delete action on settings (not supported)
    if (resource === 'settings' && action === 'delete') {
      return false;
    }
    const permission = `${resource}:${action}` as any;
    return this.hasPermission(userId, permission);
  }
}

// Export a singleton instance
export const rbac = RBAC.getInstance();