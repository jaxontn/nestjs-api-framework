import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Auth Guard
 *
 * Simplified authentication guard that works in conjunction with JwtAuthGuard.
 * Provides basic authentication checks without JWT validation for simpler use cases.
 *
 * This guard can be used for:
 * - API key authentication
 * - Basic authentication
 * - Custom authentication logic
 * - Fallback authentication methods
 *
 * Should be used alongside the @Public() decorator to skip authentication on public routes.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Determines if a request can proceed based on authentication
   *
   * @param context The execution context of the request
   * @returns Promise resolving to boolean indicating if access is granted
   * @throws UnauthorizedException if authentication is required but missing
   * @throws ForbiddenException if authentication fails
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

    const request = context.switchToHttp().getRequest();

    // Check for various authentication methods
    const authMethod = this.detectAuthMethod(request);

    try {
      switch (authMethod) {
        case 'jwt':
          return await this.validateJwtAuth(request);
        case 'api-key':
          return await this.validateApiKeyAuth(request);
        case 'basic':
          return await this.validateBasicAuth(request);
        case 'bearer':
          return await this.validateBearerAuth(request);
        case 'custom':
          return await this.validateCustomAuth(request);
        default:
          throw new UnauthorizedException('Authentication required');
      }
    } catch (error) {
      throw new UnauthorizedException('Authentication failed', error.message);
    }
  }

  /**
   * Detects the authentication method being used
   *
   * @param request The HTTP request object
   * @returns Authentication method type
   */
  private detectAuthMethod(request: any): string {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // Check for API key in headers
      if (request.headers['x-api-key'] || request.headers['api-key']) {
        return 'api-key';
      }
      // Check for API key in query parameters
      if (request.query.apiKey || request.query['api-key']) {
        return 'api-key';
      }
      return 'none';
    }

    if (authHeader.startsWith('Bearer ')) {
      return 'bearer';
    } else if (authHeader.startsWith('Basic ')) {
      return 'basic';
    } else if (authHeader.startsWith('JWT ')) {
      return 'jwt';
    } else if (authHeader.startsWith('Custom ')) {
      return 'custom';
    }

    return 'unknown';
  }

  /**
   * Validates JWT authentication
   *
   * @param request The HTTP request object
   * @returns Promise resolving to boolean
   */
  private async validateJwtAuth(request: any): Promise<boolean> {
    const token = request.headers.authorization.substring(4);

    // In a real implementation, you would validate the JWT token
    // For this simplified guard, just check if token exists
    if (!token) {
      throw new UnauthorizedException('JWT token required');
    }

    // Mock validation - in production, use proper JWT verification
    request.user = {
      id: 'user-id',
      email: 'user@example.com',
      role: 'user',
    };

    return true;
  }

  /**
   * Validates API key authentication
   *
   * @param request The HTTP request object
   * @returns Promise resolving to boolean
   */
  private async validateApiKeyAuth(request: any): Promise<boolean> {
    const apiKey = request.headers['x-api-key'] ||
                   request.headers['api-key'] ||
                   request.query.apiKey ||
                   request.query['api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Mock API key validation - in production, validate against database
    const validApiKeys = this.configService.get<string[]>('VALID_API_KEYS', []);
    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = {
      id: 'api-client',
      type: 'api-key',
      permissions: ['read', 'write'],
    };

    return true;
  }

  /**
   * Validates Basic authentication
   *
   * @param request The HTTP request object
   * @returns Promise resolving to boolean
   */
  private async validateBasicAuth(request: any): Promise<boolean> {
    const authHeader = request.headers.authorization;
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      throw new UnauthorizedException('Invalid Basic auth credentials');
    }

    // Mock validation - in production, validate against user database
    const validUsers = this.configService.get<Record<string, string>>('BASIC_AUTH_USERS', {});
    const storedPassword = validUsers[username];

    if (!storedPassword || storedPassword !== password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    request.user = {
      id: username,
      username,
      type: 'basic-auth',
      role: 'user',
    };

    return true;
  }

  /**
   * Validates Bearer token authentication (non-JWT)
   *
   * @param request The HTTP request object
   * @returns Promise resolving to boolean
   */
  private async validateBearerAuth(request: any): Promise<boolean> {
    const token = request.headers.authorization.substring(8);

    if (!token) {
      throw new UnauthorizedException('Bearer token required');
    }

    // Mock token validation - in production, validate against token store
    const validTokens = this.configService.get<string[]>('VALID_BEARER_TOKENS', []);
    if (!validTokens.includes(token)) {
      throw new UnauthorizedException('Invalid Bearer token');
    }

    request.user = {
      id: 'bearer-user',
      type: 'bearer-token',
      permissions: ['read'],
    };

    return true;
  }

  /**
   * Validates custom authentication
   *
   * @param request The HTTP request object
   * @returns Promise resolving to boolean
   */
  private async validateCustomAuth(request: any): Promise<boolean> {
    const authHeader = request.headers.authorization;
    const customToken = authHeader.split(' ')[1];

    if (!customToken) {
      throw new UnauthorizedException('Custom authentication token required');
    }

    // Implement your custom authentication logic here
    // This is just a placeholder for demonstration
    const isValid = await this.validateCustomToken(customToken);

    if (!isValid) {
      throw new UnauthorizedException('Invalid custom authentication token');
    }

    request.user = {
      id: 'custom-user',
      type: 'custom-auth',
      permissions: ['read', 'write', 'admin'],
    };

    return true;
  }

  /**
   * Validates custom token (placeholder method)
   *
   * @param token Custom token to validate
   * @returns Promise resolving to boolean
   */
  private async validateCustomToken(token: string): Promise<boolean> {
    // Implement your custom token validation logic here
    // For example: database lookup, external API call, etc.

    // Mock validation for demonstration
    return token.length > 10;
  }

  /**
   * Checks if the user has required permissions
   *
   * @param user The authenticated user object
   * @param requiredPermissions Array of required permissions
   * @returns True if user has all required permissions
   */
  private hasRequiredPermissions(user: any, requiredPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = user.permissions || [];
    return requiredPermissions.every(permission =>
      userPermissions.includes(permission) || userPermissions.includes('*')
    );
  }

  /**
   * Checks if the user has required role
   *
   * @param user The authenticated user object
   * @param requiredRole The required role
   * @returns True if user has required role
   */
  private hasRequiredRole(user: any, requiredRole: string): boolean {
    if (!requiredRole) {
      return true;
    }

    const userRole = user.role;
    if (!userRole) {
      return false;
    }

    // Role hierarchy check
    const roleHierarchy = {
      'guest': 0,
      'user': 1,
      'moderator': 2,
      'admin': 3,
      'super_admin': 4,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }
}