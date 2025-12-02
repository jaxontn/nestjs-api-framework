import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { jwtConfig } from '../../config/jwt.config';

/**
 * Authentication Module
 *
 * Provides comprehensive authentication and authorization functionality including:
 * - JWT token generation and verification
 * - Role-based access control (RBAC)
 * - Passport strategies for authentication
 * - Token refresh mechanisms
 *
 * This module is dynamically configurable and can be imported with custom options.
 */
@Module({})
export class AuthModule {
  /**
   * Configures and returns the authentication module
   *
   * @param options Optional configuration options for the auth module
   * @returns DynamicModule configured authentication module
   */
  static forRoot(options?: {
    jwtSecret?: string;
    jwtExpiresIn?: string;
    refreshSecret?: string;
    refreshExpiresIn?: string;
    global?: boolean;
  }): DynamicModule {
    const providers = [
      JwtStrategy,
      JwtAuthGuard,
      RolesGuard,
      AuthService,
      {
        provide: 'AUTH_OPTIONS',
        useValue: options || {},
      },
    ];

    const exports = [
      JwtStrategy,
      JwtAuthGuard,
      RolesGuard,
      AuthService,
    ];

    return {
      module: AuthModule,
      imports: [
        ConfigModule.forFeature(jwtConfig),
        PassportModule.register({
          defaultStrategy: 'jwt',
          property: 'user',
          session: false,
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule.forFeature(jwtConfig)],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const jwtSettings = configService.get('jwt');

            return {
              secret: options?.jwtSecret || jwtSettings?.secret,
              signOptions: {
                ...jwtSettings?.signOptions,
                expiresIn: options?.jwtExpiresIn || jwtSettings?.signOptions?.expiresIn,
              },
              verifyOptions: {
                ...jwtSettings?.verifyOptions,
              },
            };
          },
        }),
      ],
      providers,
      exports,
      global: options?.global ?? false,
    };
  }

  /**
   * Configures authentication module with custom providers
   *
   * @param providers Array of custom providers to add
   * @returns DynamicModule with custom providers
   */
  static forFeature(providers: any[] = []): DynamicModule {
    return {
      module: AuthModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Authentication Module Options Interface
 */
export interface AuthModuleOptions {
  /**
   * JWT secret key for signing tokens
   */
  jwtSecret?: string;

  /**
   * JWT token expiration time
   * Default: '1h'
   */
  jwtExpiresIn?: string;

  /**
   * Refresh token secret key
   */
  refreshSecret?: string;

  /**
   * Refresh token expiration time
   * Default: '7d'
   */
  refreshExpiresIn?: string;

  /**
   * Whether to make the auth module global
   * Default: false
   */
  global?: boolean;

  /**
   * Custom user entity for authentication
   */
  userEntity?: any;

  /**
   * Custom validation function
   */
  validateFunction?: (payload: any) => Promise<any>;

  /**
   * Enable role-based access control
   * Default: true
   */
  enableRoles?: boolean;

  /**
   * Default roles for new users
   */
  defaultRoles?: string[];

  /**
   * Enable token refresh functionality
   * Default: true
   */
  enableRefresh?: boolean;

  /**
   * Blacklist revoked tokens
   * Default: false
   */
  enableBlacklist?: boolean;

  /**
   * Token blacklist storage provider
   */
  blacklistProvider?: {
    add: (token: string) => Promise<void>;
    isRevoked: (token: string) => Promise<boolean>;
    remove: (token: string) => Promise<void>;
  };
}

/**
 * Role-based access control configuration
 */
export interface RoleConfig {
  /**
   * Available roles in the system
   */
  roles: string[];

  /**
   * Role hierarchy (higher numbers = higher privilege)
   */
  hierarchy: Record<string, number>;

  /**
   * Default role for new users
   */
  defaultRole: string;

  /**
   * Admin roles with full access
   */
  adminRoles: string[];
}

/**
 * Token configuration options
 */
export interface TokenConfig {
  /**
   * Access token configuration
   */
  accessToken: {
    secret: string;
    expiresIn: string;
    algorithm: string;
  };

  /**
   * Refresh token configuration
   */
  refreshToken: {
    secret: string;
    expiresIn: string;
    algorithm: string;
  };

  /**
   * Token issuer
   */
  issuer?: string;

  /**
   * Token audience
   */
  audience?: string;

  /**
   * Enable token rotation for refresh tokens
   */
  enableRotation?: boolean;

  /**
   * Maximum number of active tokens per user
   */
  maxActiveTokens?: number;
}