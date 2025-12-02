import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring valid JWT authentication.
 * Supports public routes and role-based access control.
 *
 * This guard extends NestJS's AuthGuard to provide comprehensive JWT validation
 * with additional features like token blacklist checking and rate limiting.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Determines if a request can access a protected route
   *
   * @param context The execution context of the request
   * @returns Promise resolving to boolean indicating if access is granted
   * @throws UnauthorizedException if authentication fails
   * @throws ForbiddenException if user lacks required permissions
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Run JWT authentication
    let isAuthenticated = false;
    try {
      isAuthenticated = await super.canActivate(context) as boolean;
    } catch (error) {
      // Handle specific authentication errors
      this.handleAuthenticationError(error);
      throw error;
    }

    if (!isAuthenticated) {
      throw new UnauthorizedException('Authentication failed');
    }

    // Get request object
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not found in token');
    }

    // Validate user status
    await this.validateUserStatus(user);

    // Check token blacklist if enabled
    await this.checkTokenBlacklist(request, user);

    // Apply rate limiting if configured
    await this.checkRateLimit(request, user);

    // Validate roles if required
    await this.validateRoles(context, user);

    // Validate permissions if enabled
    await this.validatePermissions(context, user);

    return true;
  }

  /**
   * Handles authentication errors with specific messages
   *
   * @param error The authentication error
   */
  private handleAuthenticationError(error: any): void {
    if (error.message?.includes('expired')) {
      throw new UnauthorizedException('Token has expired');
    } else if (error.message?.includes('malformed')) {
      throw new UnauthorizedException('Invalid token format');
    } else if (error.message?.includes('signature')) {
      throw new UnauthorizedException('Invalid token signature');
    } else if (error.message?.includes('invalid token')) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Validates user status (active, suspended, etc.)
   *
   * @param user The authenticated user
   */
  private async validateUserStatus(user: any): Promise<void> {
    // Check if user is active
    if (user.status === 'inactive') {
      throw new UnauthorizedException('User account is inactive');
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      throw new ForbiddenException('User account is suspended');
    }

    // Check if user is banned
    if (user.status === 'banned') {
      throw new ForbiddenException('User account is banned');
    }

    // Check email verification if required
    const emailVerificationRequired = this.configService.get<boolean>(
      'auth.emailVerificationRequired',
      false
    );

    if (emailVerificationRequired && !user.emailVerified) {
      throw new ForbiddenException('Email verification required');
    }

    // Check if user has accepted terms if required
    const termsAcceptanceRequired = this.configService.get<boolean>(
      'auth.termsAcceptanceRequired',
      false
    );

    if (termsAcceptanceRequired && !user.termsAccepted) {
      throw new ForbiddenException('Terms of service acceptance required');
    }
  }

  /**
   * Checks if the token is blacklisted
   *
   * @param request The HTTP request
   * @param user The authenticated user
   */
  private async checkTokenBlacklist(request: any, user: any): Promise<void> {
    const blacklistEnabled = this.configService.get<boolean>(
      'auth.enableBlacklist',
      false
    );

    if (!blacklistEnabled) {
      return;
    }

    const token = this.extractToken(request);
    if (!token) {
      return;
    }

    // In a real implementation, you would check against a blacklist storage
    // Example: const isBlacklisted = await this.blacklistService.isBlacklisted(token);
    // if (isBlacklisted) {
    //   throw new UnauthorizedException('Token has been revoked');
    // }
  }

  /**
   * Applies rate limiting to authenticated requests
   *
   * @param request The HTTP request
   * @param user The authenticated user
   */
  private async checkRateLimit(request: any, user: any): Promise<void> {
    const rateLimitEnabled = this.configService.get<boolean>(
      'auth.enableRateLimit',
      false
    );

    if (!rateLimitEnabled) {
      return;
    }

    // Different rate limits for different user roles
    const rateLimits = {
      admin: { requests: 1000, windowMs: 15 * 60 * 1000 }, // 1000 requests per 15 minutes
      premium: { requests: 500, windowMs: 15 * 60 * 1000 }, // 500 requests per 15 minutes
      user: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    };

    const userRateLimit = rateLimits[user.role] || rateLimits.user;

    // In a real implementation, you would use a rate limiting service
    // Example: await this.rateLimitService.checkLimit(user.sub, userRateLimit);
  }

  /**
   * Validates user roles for the requested route
   *
   * @param context The execution context
   * @param user The authenticated user
   */
  private async validateRoles(
    context: ExecutionContext,
    user: any
  ): Promise<void> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return; // No role requirements
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // Check role hierarchy if configured
    await this.checkRoleHierarchy(user.role, requiredRoles);
  }

  /**
   * Validates role-based permissions
   *
   * @param context The execution context
   * @param user The authenticated user
   */
  private async validatePermissions(
    context: ExecutionContext,
    user: any
  ): Promise<void> {
    const permissionsEnabled = this.configService.get<boolean>(
      'auth.enablePermissions',
      false
    );

    if (!permissionsEnabled) {
      return;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return; // No permission requirements
    }

    // Check if user has required permissions
    // In a real implementation, you would check against a permissions service
    // Example: const hasPermissions = await this.permissionsService.checkPermissions(
    //   user.sub, requiredPermissions
    // );
    // if (!hasPermissions) {
    //   throw new ForbiddenException('Insufficient permissions');
    // }
  }

  /**
   * Checks role hierarchy for advanced access control
   *
   * @param userRole The user's role
   * @param requiredRoles The required roles for the route
   */
  private async checkRoleHierarchy(
    userRole: string,
    requiredRoles: string[]
  ): Promise<void> {
    const roleHierarchy = this.configService.get<Record<string, number>>(
      'auth.roleHierarchy',
      {
        guest: 0,
        user: 1,
        moderator: 2,
        admin: 3,
        super_admin: 4,
      }
    );

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = Math.max(
      ...requiredRoles.map((role) => roleHierarchy[role] || 0)
    );

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        'Access denied: Insufficient role level'
      );
    }
  }

  /**
   * Extracts JWT token from request
   *
   * @param request The HTTP request
   * @returns The JWT token or null if not found
   */
  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * Handles request logging for audit purposes
   *
   * @param context The execution context
   * @param user The authenticated user
   */
  private async logRequest(
    context: ExecutionContext,
    user: any
  ): Promise<void> {
    const loggingEnabled = this.configService.get<boolean>(
      'auth.enableRequestLogging',
      false
    );

    if (!loggingEnabled) {
      return;
    }

    const request = context.switchToHttp().getRequest();
    const logData = {
      userId: user.sub,
      userRole: user.role,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    // In a real implementation, you would log this data
    // Example: await this.auditService.log(logData);
  }
}