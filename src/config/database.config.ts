import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: configService.get<string>('database.type') as any,
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),

  // Entity loading - auto-discover all entities
  entities: [
    join(__dirname, '**', '*.entity{.ts,.js}'),
    join(__dirname, 'modules', '**', 'entities', '*{.ts,.js}'),
  ],

  // Migration settings
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  cli: {
    migrationsDir: join(__dirname, 'migrations'),
  },

  // Performance settings
  synchronize: configService.get<boolean>('database.synchronize', false),
  logging: configService.get<boolean>('database.logging', false),
  timezone: configService.get<string>('database.timezone', '+00:00'),
  charset: configService.get<string>('database.charset', 'utf8mb4'),

  // Connection pool for performance
  extra: {
    connectionLimit: configService.get<number>('database.connectionLimit', 50),
    acquireTimeout: configService.get<number>('database.acquireTimeout', 60000),
    timeout: configService.get<number>('database.timeout', 60000),
  },

  // Auto load entities for fast startup
  autoLoadEntities: true,

  // Lazy loading for better performance
  lazyLoadEntities: true,
});