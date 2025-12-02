import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

/**
 * JWT Configuration
 *
 * Provides JWT configuration for authentication and authorization.
 * Supports token signing, verification, and refresh token functionality.
 */
export const jwtConfig = registerAs('jwt', (): JwtModuleOptions => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    secret,
    signOptions: {
      expiresIn,
      issuer,
      audience,
      algorithm: 'HS256',
      encoding: 'utf8',
    },
    verifyOptions: {
      ignoreExpiration: false,
      algorithms: ['HS256'],
      issuer,
      audience,
    },
    // Additional configuration for refresh tokens
    refreshSecret: refreshSecret || secret + '_refresh',
    refreshExpiresIn,
  };
});

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Refresh Token Payload Interface
 */
export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Token Pair Interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}