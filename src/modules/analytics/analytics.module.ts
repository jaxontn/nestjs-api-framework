import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DailyAnalytic } from '../../entities/daily-analytic.entity';
import { Merchant } from '../../entities/merchant.entity';
import { Customer } from '../../entities/customer.entity';
import { GameSession } from '../../entities/game-session.entity';
import { QrCampaign } from '../../entities/qr-campaign.entity';
import { Leaderboard } from '../../entities/leaderboard.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyAnalytic,
      Merchant,
      Customer,
      GameSession,
      QrCampaign,
      Leaderboard,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService]
})
export class AnalyticsModule {}
