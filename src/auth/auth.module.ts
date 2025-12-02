import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../modules/customers/strategies/jwt.strategy';
import { CustomersModule } from '../modules/customers/customers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { Merchant } from '../entities/merchant.entity';
import { GameSession } from '../entities/game-session.entity';
import { Leaderboard } from '../entities/leaderboard.entity';
import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';
import { AuthService } from '../modules/customers/auth.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '0') || 60 * 60 * 24 * 7,
      },
    }),
    CustomersModule,
    TypeOrmModule.forFeature([Customer, Merchant, GameSession, Leaderboard, LoyaltyTransaction]),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}