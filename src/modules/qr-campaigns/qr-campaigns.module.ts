import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCampaign } from '../../entities/qr-campaign.entity';
import { Merchant } from '../../entities/merchant.entity';
import { MerchantUser } from '../../entities/merchant-user.entity';
import { GameSession } from '../../entities/game-session.entity';
import { QrCampaignsController } from './qr-campaigns.controller';
import { QrCampaignsService } from './qr-campaigns.service';
import { QrCodeService } from './qr-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QrCampaign,
      Merchant,
      MerchantUser,
      GameSession,
    ]),
  ],
  controllers: [QrCampaignsController],
  providers: [
    QrCampaignsService,
    QrCodeService,
  ],
  exports: [QrCampaignsService],
})
export class QrCampaignsModule {}