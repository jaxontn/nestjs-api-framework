import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';

/**
 * Roles Guard
 *
 * Implements Role-Based Access Control (RBAC) to protect routes based on user roles.
 * Supports role hierarchy, multiple role requirements, and dynamic role validation.
 *
 * This guard works in conjunction with the @Roles() decorator to enforce
 * access control at the route and controller level.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly roleHierarchy: Record<string, number>;
  private readonly defaultRoles: string[];
  private readonly adminRoles: string[];

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    // Load role hierarchy from configuration
    this.roleHierarchy = this.configService.get<Record<string, number>>(
      'auth.roleHierarchy',
      {
        guest: 0,
        user: 1,
        moderator: 2,
        admin: 3,
        super_admin: 4,
      }
    );

    // Load default roles
    this.defaultRoles = this.configService.get<string[]>(
      'auth.defaultRoles',
      ['user']
    );

    // Load admin roles with full access
    this.adminRoles = this.configService.get<string[]>(
      'auth.adminRoles',
      ['admin', 'super_admin']
    );
  }

  /**
   * Determines if a user can access a protected route based on their roles
   *
   * @param context The execution context of the request
   * @returns Promise resolving to boolean indicating if access is granted
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user lacks required roles
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from the route/controller
    const requiredRoles = this.getRequiredRoles(context);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the request and user from context
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get user's roles (support both single role and multiple roles)
    const userRoles = this.getUserRoles(user);

    // Validate user has roles
    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException('No roles assigned to user');
    }

    // Check access based on different strategies
    const hasAccess = await this.checkRoleAccess(userRoles, requiredRoles, user);

    if (!hasAccess) {
      this.logAccessDenied(context, user, userRoles, requiredRoles);
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // Log successful access
    this.logAccessGranted(context, user, userRoles);

    return true;
  }

  /**
   * Extracts required roles from the execution context
   *
   * @param context The execution context
   * @returns Array of required roles or null if no roles required
   */
  private getRequiredRoles(context: ExecutionContext): string[] | null {
    return this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /**
   * Extracts user roles from the user object
   *
   * @param user The authenticated user object
   * @returns Array of user roles
   */
  private getUserRoles(user: any): string[] {
    // Support multiple formats for user roles
    if (Array.isArray(user.roles)) {
      return user.roles;
    } else if (typeof user.role === 'string') {
      return [user.role];
    } else if (user.roles && typeof user.roles === 'object') {
      // Handle role objects with structure like { admin: true, user: true }
      return Object.entries(user.roles)
        .filter(([_, hasRole]) => hasRole)
        .map(([role]) => role);
    }

    // Default to user role if no roles found
    return this.defaultRoles;
  }

  /**
   * Checks if user has access based on role requirements
   *
   * @param userRoles User's roles
   * @param requiredRoles Required roles for the route
   * @param user The user object
   * @returns Promise resolving to boolean indicating if access is granted
   */
  private async checkRoleAccess(
    userRoles: string[],
    requiredRoles: string[],
    user: any
  ): Promise<boolean> {
    // Check if user is admin (bypass all role checks)
    if (this.isAdmin(userRoles)) {
      return true;
    }

    // Check if user has any of the required roles (OR logic)
    const hasAnyRole = requiredRoles.some((requiredRole) =>
      userRoles.includes(requiredRole)
    );

    if (hasAnyRole) {
      return true;
    }

    // Check role hierarchy (user can access if they have a higher-level role)
    const hasHierarchyAccess = this.checkRoleHierarchy(userRoles, requiredRoles);
    if (hasHierarchyAccess) {
      return true;
    }

    // Check custom permission logic if configured
    const hasCustomPermission = await this.checkCustomPermissions(
      user,
      requiredRoles
    );
    if (hasCustomPermission) {
      return true;
    }

    // Check temporary role assignments if enabled
    const hasTemporaryAccess = await this.checkTemporaryRoles(user, requiredRoles);
    if (hasTemporaryAccess) {
      return true;
    }

    return false;
  }

  /**
   * Checks if user has admin privileges
   *
   * @param userRoles User's roles
   * @returns True if user is admin, false otherwise
   */
  private isAdmin(userRoles: string[]): boolean {
    return userRoles.some((role) => this.adminRoles.includes(role));
  }

  /**
   * Checks role hierarchy for access
   *
   * @param userRoles User's roles
   * @param requiredRoles Required roles for the route
   * @returns True if user has sufficient hierarchy level, false otherwise
   */
  private checkRoleHierarchy(userRoles: string[], requiredRoles: string[]): boolean {
    // Get the highest user role level
    const maxUserLevel = Math.max(
      ...userRoles.map((role) => this.roleHierarchy[role] || 0)
    );

    // Get the minimum required role level
    const minRequiredLevel = Math.min(
      ...requiredRoles.map((role) => this.roleHierarchy[role] || 0)
    );

    return maxUserLevel >= minRequiredLevel;
  }

  /**
   * Checks custom permissions (extensible for business logic)
   *
   * @param user The user object
   * @param requiredRoles Required roles
   * @returns Promise resolving to boolean
   */
  private async checkCustomPermissions(
    user: any,
    requiredRoles: string[]
  ): Promise<boolean> {
    // This method can be extended with custom business logic
    // For example: checking database permissions, feature flags, etc.

    const customPermissionsEnabled = this.configService.get<boolean>(
      'auth.enableCustomPermissions',
      false
    );

    if (!customPermissionsEnabled) {
      return false;
    }

    // Example custom logic - to be implemented based on requirements
    // const customService = this.customPermissionsService;
    // return await customService.hasPermission(user.sub, requiredRoles);

    return false;
  }

  /**
   * Checks temporary role assignments
   *
   * @param user The user object
   * @param requiredRoles Required roles
   * @returns Promise resolving to boolean
   */
  private async checkTemporaryRoles(
    user: any,
    requiredRoles: string[]
  ): Promise<boolean> {
    const temporaryRolesEnabled = this.configService.get<boolean>(
      'auth.enableTemporaryRoles',
      false
    );

    if (!temporaryRolesEnabled) {
      return false;
    }

    // Check for temporary role assignments
    // This would typically involve checking a database or cache
    // for time-limited role assignments

    // Example implementation:
    // const tempRoles = await this.temporaryRolesService.getTemporaryRoles(user.sub);
    // const hasTemporaryAccess = requiredRoles.some(role => tempRoles.includes(role));
    // return hasTemporaryAccess;

    return false;
  }

  /**
   * Logs successful access for audit purposes
   *
   * @param context The execution context
   * @param user The user object
   * @param userRoles User's roles
   */
  private logAccessGranted(
    context: ExecutionContext,
    user: any,
    userRoles: string[]
  ): void {
    const loggingEnabled = this.configService.get<boolean>(
      'auth.enableRoleLogging',
      false
    );

    if (!loggingEnabled) {
      return;
    }

    const request = context.switchToHttp().getRequest();
    const logData = {
      event: 'ROLE_ACCESS_GRANTED',
      userId: user.sub,
      userRoles,
      method: request.method,
      url: request.url,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    // Log the access granted event
    console.log('Role access granted:', logData);

    // In production, you would send this to a proper logging service
    // Example: this.loggerService.log(logData);
  }

  /**
   * Logs access denied events for security monitoring
   *
   * @param context The execution context
   * @param user The user object
   * @param userRoles User's roles
   * @param requiredRoles Required roles
   */
  private logAccessDenied(
    context: ExecutionContext,
    user: any,
    userRoles: string[],
    requiredRoles: string[]
  ): void {
    const loggingEnabled = this.configService.get<boolean>(
      'auth.enableRoleLogging',
      true
    );

    if (!loggingEnabled) {
      return;
    }

    const request = context.switchToHttp().getRequest();
    const logData = {
      event: 'ROLE_ACCESS_DENIED',
      userId: user.sub,
      userRoles,
      requiredRoles,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    // Log the access denied event (security important)
    console.warn('Role access denied:', logData);

    // In production, you would send this to a security monitoring service
    // Example: this.securityService.logUnauthorizedAccess(logData);
  }

  /**
   * Validates role configuration
   *
   * @returns True if configuration is valid, throws exception otherwise
   */
  private validateConfiguration(): boolean {
    // Ensure role hierarchy is properly configured
    if (Object.keys(this.roleHierarchy).length === 0) {
      throw new Error('Role hierarchy not configured');
    }

    // Ensure admin roles are defined
    if (this.adminRoles.length === 0) {
      throw new Error('Admin roles not configured');
    }

    // Ensure default roles are defined
    if (this.defaultRoles.length === 0) {
      throw new Error('Default roles not configured');
    }

    return true;
  }
}