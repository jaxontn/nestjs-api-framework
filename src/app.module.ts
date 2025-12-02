import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './core/auth/auth.module';
import { DatabaseModule } from './core/database/database.module';
import { HealthModule } from './core/health/health.module';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { swaggerConfig } from './config/swagger.config';
import { configuration } from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Core Modules
    HealthModule,
    AuthModule,
    DatabaseModule,

    // Feature modules will be dynamically imported here
    // Example: UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}