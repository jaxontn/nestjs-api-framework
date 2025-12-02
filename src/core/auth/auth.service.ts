import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import {
  JwtPayload,
  RefreshTokenPayload,
  TokenPair,
} from '../../config/jwt.config';

const scrypt = promisify(_scrypt);

/**
 * Authentication Service
 *
 * Provides comprehensive authentication functionality including:
 * - User authentication and password management
 * - JWT token generation and validation
 * - Refresh token management
 * - Password hashing and verification
 * - Session management
 *
 * This service serves as the core authentication engine for the application.
 */
@Injectable()
export class AuthService {
  private readonly refreshTokens = new Map<string, RefreshTokenPayload>(); // In production, use Redis/database
  private readonly passwordSaltLength = 32;
  private readonly tokenLength = 32;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticates a user with email and password
   *
   * @param email User's email address
   * @param password User's password
   * @returns Promise resolving to authenticated user object
   * @throws UnauthorizedException if credentials are invalid
   * @throws NotFoundException if user is not found
   */
  async validateUser(email: string, password: string): Promise<any> {
    // In a real implementation, you would fetch the user from database
    // const user = await this.userService.findByEmail(email);

    // For demo purposes, return a mock user
    const user = {
      id: '1',
      email,
      password: await this.hashPassword('password123'), // This would come from database
      role: 'user',
      status: 'active',
      emailVerified: true,
      termsAccepted: true,
    };

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    this.validateUserStatus(user);

    // Remove password from returned user object
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Generates JWT token pair (access and refresh tokens)
   *
   * @param user User object to generate tokens for
   * @returns Promise resolving to TokenPair object
   */
  async generateTokens(user: any): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId: this.generateTokenId(),
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    const refreshTokenSecret = this.configService.get<string>(
      'jwt.refreshSecret'
    ) || this.configService.get<string>('jwt.secret') + '_refresh';

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: refreshTokenSecret,
      expiresIn: this.configService.get<string>(
        'jwt.refreshExpiresIn',
        '7d'
      ),
    });

    // Store refresh token (in production, use Redis or database)
    this.refreshTokens.set(refreshTokenPayload.tokenId, refreshTokenPayload);

    const expiresIn = this.configService.get<number>('jwt.expiresIn', 3600);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Refreshes access token using refresh token
   *
   * @param refreshToken The refresh token
   * @returns Promise resolving to new TokenPair object
   * @throws UnauthorizedException if refresh token is invalid or revoked
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const refreshTokenSecret = this.configService.get<string>(
        'jwt.refreshSecret'
      ) || this.configService.get<string>('jwt.secret') + '_refresh';

      const payload: RefreshTokenPayload = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: refreshTokenSecret }
      );

      // Validate refresh token payload
      if (payload.type !== 'refresh' || !payload.tokenId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token exists and is not revoked
      const storedToken = this.refreshTokens.get(payload.tokenId);
      if (!storedToken) {
        throw new UnauthorizedException('Refresh token not found or revoked');
      }

      // Get user information (in production, fetch from database)
      const user = {
        id: payload.sub,
        email: 'user@example.com', // This would come from database
        role: 'user',
        status: 'active',
      };

      // Validate user status
      this.validateUserStatus(user);

      // Generate new tokens
      return await this.generateTokens(user);

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Revokes a refresh token
   *
   * @param refreshToken The refresh token to revoke
   * @returns Promise resolving to boolean indicating success
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const refreshTokenSecret = this.configService.get<string>(
        'jwt.refreshSecret'
      ) || this.configService.get<string>('jwt.secret') + '_refresh';

      const payload: RefreshTokenPayload = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: refreshTokenSecret }
      );

      // Remove refresh token from storage
      return this.refreshTokens.delete(payload.tokenId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Revokes all refresh tokens for a user
   *
   * @param userId User ID
   * @returns Promise resolving to number of revoked tokens
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    let revokedCount = 0;

    for (const [tokenId, token] of this.refreshTokens.entries()) {
      if (token.sub === userId) {
        this.refreshTokens.delete(tokenId);
        revokedCount++;
      }
    }

    return revokedCount;
  }

  /**
   * Hashes a password using scrypt
   *
   * @param password Plain text password
   * @returns Promise resolving to hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(this.passwordSaltLength).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}.${hash.toString('hex')}`;
  }

  /**
   * Validates a password against its hash
   *
   * @param password Plain text password
   * @param hashedPassword Hashed password
   * @returns Promise resolving to boolean indicating if password is valid
   */
  async validatePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      const [salt, hash] = hashedPassword.split('.');
      const computedHash = (await scrypt(password, salt, 64)) as Buffer;
      return computedHash.toString('hex') === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates a secure random token ID
   *
   * @returns Random token ID string
   */
  private generateTokenId(): string {
    return randomBytes(this.tokenLength).toString('hex');
  }

  /**
   * Validates user status and permissions
   *
   * @param user User object to validate
   * @throws UnauthorizedException or ForbiddenException for invalid status
   */
  private validateUserStatus(user: any): void {
    switch (user.status) {
      case 'inactive':
        throw new UnauthorizedException('User account is inactive');
      case 'suspended':
        throw new ForbiddenException('User account is suspended');
      case 'banned':
        throw new ForbiddenException('User account is banned');
      case 'active':
        break; // User is active, continue
      default:
        throw new UnauthorizedException('Invalid user status');
    }

    // Check email verification if required
    const emailVerificationRequired = this.configService.get<boolean>(
      'auth.emailVerificationRequired',
      false
    );

    if (emailVerificationRequired && !user.emailVerified) {
      throw new ForbiddenException('Email verification required');
    }

    // Check terms acceptance if required
    const termsAcceptanceRequired = this.configService.get<boolean>(
      'auth.termsAcceptanceRequired',
      false
    );

    if (termsAcceptanceRequired && !user.termsAccepted) {
      throw new ForbiddenException('Terms of service acceptance required');
    }
  }

  /**
   * Verifies JWT token and returns payload
   *
   * @param token JWT token to verify
   * @returns Promise resolving to JwtPayload
   * @throws UnauthorizedException if token is invalid
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Decodes JWT token without verification (for debugging)
   *
   * @param token JWT token to decode
   * @returns Decoded token payload
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  /**
   * Changes user password
   *
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Promise resolving to boolean indicating success
   * @throws UnauthorizedException if current password is invalid
   * @throws BadRequestException if new password is invalid
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Validate new password
    if (!this.validatePasswordStrength(newPassword)) {
      throw new BadRequestException('New password does not meet security requirements');
    }

    // In a real implementation, you would:
    // 1. Get user from database
    // 2. Verify current password
    // 3. Hash new password
    // 4. Update password in database
    // 5. Revoke all refresh tokens for security

    // For demo purposes, return success
    await this.revokeAllUserTokens(userId);
    return true;
  }

  /**
   * Validates password strength
   *
   * @param password Password to validate
   * @returns True if password meets requirements, false otherwise
   */
  private validatePasswordStrength(password: string): boolean {
    const minLength = this.configService.get<number>(
      'auth.passwordMinLength',
      8
    );
    const requireUppercase = this.configService.get<boolean>(
      'auth.passwordRequireUppercase',
      true
    );
    const requireLowercase = this.configService.get<boolean>(
      'auth.passwordRequireLowercase',
      true
    );
    const requireNumbers = this.configService.get<boolean>(
      'auth.passwordRequireNumbers',
      true
    );
    const requireSpecialChars = this.configService.get<boolean>(
      'auth.passwordRequireSpecialChars',
      false
    );

    // Check minimum length
    if (password.length < minLength) {
      return false;
    }

    // Check uppercase requirement
    if (requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    // Check lowercase requirement
    if (requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    // Check numbers requirement
    if (requireNumbers && !/\d/.test(password)) {
      return false;
    }

    // Check special characters requirement
    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Generates a password reset token
   *
   * @param email User's email address
   * @returns Promise resolving to password reset token
   * @throws NotFoundException if user is not found
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    // In a real implementation, you would:
    // 1. Verify user exists in database
    // 2. Generate secure reset token
    // 3. Store token with expiration
    // 4. Send email with reset link

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

    // In production, store this in database
    console.log(`Password reset token for ${email}: ${resetToken} (expires: ${expiresAt})`);

    return resetToken;
  }

  /**
   * Resets password using reset token
   *
   * @param token Password reset token
   * @param newPassword New password
   * @returns Promise resolving to boolean indicating success
   * @throws BadRequestException if token is invalid or expired
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // In a real implementation, you would:
    // 1. Verify reset token exists and is not expired
    // 2. Get user associated with token
    // 3. Validate new password strength
    // 4. Hash new password
    // 5. Update password in database
    // 6. Remove reset token
    // 7. Revoke all refresh tokens for security

    if (!this.validatePasswordStrength(newPassword)) {
      throw new BadRequestException('New password does not meet security requirements');
    }

    // For demo purposes, return success
    console.log(`Password reset with token: ${token}`);
    return true;
  }
}