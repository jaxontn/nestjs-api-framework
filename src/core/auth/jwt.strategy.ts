import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, RefreshTokenPayload } from '../../config/jwt.config';

/**
 * JWT Strategy for Passport
 *
 * Handles JWT token validation and extraction.
 * Supports both access tokens and refresh tokens with different validation logic.
 *
 * This strategy is used by Passport.js to authenticate requests using JWT tokens
 * from the Authorization header.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extract JWT from Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Secret key for verifying JWT signature
      secretOrKey: configService.get<string>('jwt.secret'),

      // Ignore expiration if explicitly configured (not recommended for production)
      ignoreExpiration: configService.get<boolean>('jwt.ignoreExpiration', false),

      // JWT issuer verification
      issuer: configService.get<string>('jwt.issuer'),

      // JWT audience verification
      audience: configService.get<string>('jwt.audience'),

      // Algorithm for signing tokens
      algorithms: configService.get<string[]>('jwt.algorithms', ['HS256']),

      // Pass request object to validate function for additional validation
      passReqToCallback: false,
    });
  }

  /**
   * Validates the JWT payload and returns user information
   *
   * @param payload The decoded JWT payload
   * @returns Promise resolving to validated user payload
   * @throws UnauthorizedException if token is invalid or user not found
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Basic payload validation
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload: missing subject');
    }

    // Token type validation (supporting different token types)
    if (payload.type && !['access', 'refresh'].includes(payload.type)) {
      throw new UnauthorizedException('Invalid token type');
    }

    // Check if token is expired (additional check beyond Passport's validation)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Token has expired');
    }

    // Validate user ID format
    if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      throw new UnauthorizedException('Invalid user identifier in token');
    }

    // Validate email format if present
    if (payload.email && !this.isValidEmail(payload.email)) {
      throw new UnauthorizedException('Invalid email format in token');
    }

    // Additional custom validation can be added here
    // For example: check if user is still active in database
    // const user = await this.userService.findById(payload.sub);
    // if (!user || !user.isActive) {
    //   throw new UnauthorizedException('User not found or inactive');
    // }

    // Return the validated payload
    // You can transform or enrich the payload here if needed
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role || 'user',
      iat: payload.iat,
      exp: payload.exp,
      iss: payload.iss,
      aud: payload.aud,
      // Add any additional fields needed for your application
    };
  }

  /**
   * Validates a refresh token payload
   *
   * @param payload The decoded refresh token payload
   * @returns Promise resolving to validated refresh token payload
   */
  async validateRefreshToken(payload: RefreshTokenPayload): Promise<RefreshTokenPayload> {
    if (!payload || !payload.sub || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    // Additional refresh token validation
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Check if the refresh token has been revoked (implement based on your storage)
    // const isRevoked = await this.tokenBlacklistService.isRevoked(payload.tokenId);
    // if (isRevoked) {
    //   throw new UnauthorizedException('Refresh token has been revoked');
    // }

    return payload;
  }

  /**
   * Extracts JWT token from various sources
   *
   * @param request The HTTP request object
   * @returns The extracted JWT token or null if not found
   */
  private extractToken(request: any): string | null {
    // Try Authorization header first (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie if configured
    const cookieName = this.configService.get<string>('jwt.cookieName');
    if (cookieName && request.cookies && request.cookies[cookieName]) {
      return request.cookies[cookieName];
    }

    // Try query parameter (not recommended for production)
    const queryToken = request.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }

  /**
   * Validates email format
   *
   * @param email Email address to validate
   * @returns True if email is valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Refresh Token Strategy
 *
 * Specialized strategy for handling refresh tokens with different validation logic
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.refreshSecret') ||
                   configService.get<string>('jwt.secret') + '_refresh',
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  /**
   * Validates refresh token payload
   *
   * @param payload The decoded refresh token payload
   * @returns Validated refresh token payload
   */
  async validate(payload: RefreshTokenPayload): Promise<RefreshTokenPayload> {
    if (!payload || !payload.sub || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type for refresh');
    }

    return payload;
  }
}