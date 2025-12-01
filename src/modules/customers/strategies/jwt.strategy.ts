import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request) => {
        // For customer sessions, use the JWT_SECRET
        return process.env.JWT_SECRET;
      },
    });
  }

  async validate(payload: any) {
    try {
      // For customer session tokens, verify session exists
      const customer = await this.authService.getCustomerByPhoneOrEmail(payload.customer_id, payload.customer_id);

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Verify session is valid and not expired
      if (payload.type === 'customer_session') {
        // This would integrate with Redis/session store in production
        // For now, we'll just validate the customer exists
        return {
          customer_id: payload.customer_id,
          session_id: payload.session_id,
          type: payload.type,
        };
      }

      // For merchant authentication (future implementation)
      if (payload.type === 'merchant_auth') {
        // Validate merchant user exists
        return {
          customer_id: payload.customer_id,
          type: payload.type,
        };
      }

      return null;
    } catch (error) {
      throw new Error(`JWT validation failed: ${error.message}`);
    }
  }
}