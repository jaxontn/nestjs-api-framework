import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantUsersController } from './merchant-users.controller';
import { MerchantUsersService } from './merchant-users.service';
import { MerchantUser } from './entities/merchant-user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Merchant } from '../../entities/merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantUser,
      UserRole,
      UserActivity,
      Merchant,
    ]),
  ],
  controllers: [MerchantUsersController],
  providers: [MerchantUsersService],
  exports: [MerchantUsersService],
})
export class MerchantUsersModule {}
