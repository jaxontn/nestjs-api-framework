import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { Achievement, UserAchievement } from './entities/achievement.entity';
import { Customer } from '../../entities/customer.entity';
import { Merchant } from '../../entities/merchant.entity';
import { GameSession } from '../../entities/game-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Challenge,
      UserChallenge,
      Achievement,
      UserAchievement,
      Customer,
      Merchant,
      GameSession,
    ]),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}