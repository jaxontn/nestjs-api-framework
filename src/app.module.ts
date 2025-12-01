import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Merchant } from './entities/merchant.entity';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { GamesModule } from './modules/games/games.module';
import { QrCampaignsModule } from './modules/qr-campaigns/qr-campaigns.module';
import { CustomersModule } from './customers/customers.module';
import { AuthModule } from './auth/auth.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { MerchantUsersModule } from './modules/merchant-users/merchant-users.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'gamified_crm'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
        logging: configService.get<boolean>('DB_LOGGING', true),
        timezone: '+00:00',
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Merchant]),
    MerchantsModule,
    GamesModule,
    QrCampaignsModule,
    CustomersModule,
    AuthModule,
    LoyaltyModule,
    ChallengesModule,
    MerchantUsersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
