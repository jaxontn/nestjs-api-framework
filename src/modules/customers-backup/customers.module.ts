import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from '../../entities/customer.entity';
import { GameSession } from '../../entities/game-session.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, GameSession, Leaderboard])
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService]
})
export class CustomersModule {}
