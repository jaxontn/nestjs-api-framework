import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { LoyaltyReward } from './entities/loyalty-reward.entity';
import { Customer } from '../../entities/customer.entity';
import { Merchant } from '../../entities/merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyRule,
      LoyaltyTransaction,
      LoyaltyReward,
      Customer,
      Merchant,
    ]),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule { }