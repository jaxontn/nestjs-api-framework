import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../../config/database.config';

/**
 * Database Module
 *
 * Provides TypeORM database connection management with support for:
 * - Multiple database connections
 * - Connection pooling
 * - Transaction management
 * - Health monitoring
 * - Migration support
 *
 * This module is global and provides database services throughout the application.
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * Configures and returns the database module with TypeORM
   *
   * @param options Optional configuration options for database connections
   * @returns DynamicModule configured database module
   */
  static forRoot(options?: DatabaseModuleOptions): DynamicModule {
    const providers = [
      {
        provide: 'DATABASE_CONFIG',
        useFactory: (configService: ConfigService) => {
          const config = databaseConfig(configService);
          return {
            ...config,
            ...options,
            // Add connection name for multiple connections
            name: options?.connectionName,
          };
        },
        inject: [ConfigService],
      },
      {
        provide: DataSource,
        useFactory: async (configService: ConfigService) => {
          try {
            const config = databaseConfig(configService);
            const dataSource = new DataSource({
              ...config,
              ...options,
              // Ensure entities are auto-loaded
              autoLoadEntities: true,
              // Enable logging in development
              logging: configService.get<string>('NODE_ENV') === 'development',
            });

            // Initialize the data source
            await dataSource.initialize();

            console.log('Database connection established successfully');

            // Validate connection
            await dataSource.query('SELECT 1');
            console.log('Database connection validated');

            return dataSource;
          } catch (error) {
            console.error('Database connection failed:', error.message);
            throw error;
          }
        },
        inject: [ConfigService],
      },
      {
        provide: 'DATABASE_HEALTH',
        useFactory: (dataSource: DataSource) => {
          return {
            check: async () => {
              try {
                await dataSource.query('SELECT 1');
                return { status: 'healthy', timestamp: new Date().toISOString() };
              } catch (error) {
                return {
                  status: 'unhealthy',
                  error: error.message,
                  timestamp: new Date().toISOString()
                };
              }
            },
          };
        },
        inject: [DataSource],
      },
    ];

    const exports = [DataSource, 'DATABASE_HEALTH'];

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const config = databaseConfig(configService);
            return {
              ...config,
              ...options,
            };
          },
        }),
      ],
      providers,
      exports,
    };
  }

  /**
   * Configures database module for specific entities
   *
   * @param entities Array of entities to register
   * @param connectionName Optional connection name
   * @returns DynamicModule with specified entities
   */
  static forFeature(
    entities: any[] = [],
    connectionName?: string
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forFeature(entities, connectionName),
      ],
      providers: [],
      exports: [TypeOrmModule],
    };
  }

  /**
   * Creates a module for multiple database connections
   *
   * @param connections Array of connection configurations
   * @returns DynamicModule with multiple connections
   */
  static forMultipleConnections(
    connections: Array<{
      name: string;
      config: DataSourceOptions;
      entities?: any[];
    }>
  ): DynamicModule {
    const providers = connections.map((connection) => ({
      provide: `DATA_SOURCE_${connection.name.toUpperCase()}`,
      useFactory: async () => {
        const dataSource = new DataSource({
          ...connection.config,
          entities: connection.entities,
          name: connection.name,
        });
        await dataSource.initialize();
        return dataSource;
      },
    }));

    const exports = connections.map((connection) => `DATA_SOURCE_${connection.name.toUpperCase()}`);

    return {
      module: DatabaseModule,
      providers,
      exports,
    };
  }
}

/**
 * Database Module Configuration Options
 */
export interface DatabaseModuleOptions extends Partial<DataSourceOptions> {
  /**
   * Connection name for multiple connections
   */
  connectionName?: string;

  /**
   * Custom entities to load
   */
  entities?: any[];

  /**
   * Custom migrations
   */
  migrations?: any[];

  /**
   * Custom subscribers
   */
  subscribers?: any[];

  /**
   * Auto-run migrations on startup
   */
  autoRunMigrations?: boolean;

  /**
   * Enable connection retry
   */
  enableRetry?: boolean;

  /**
   * Maximum retry attempts
   */
  retryAttempts?: number;

  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;

  /**
   * Enable connection health monitoring
   */
  enableHealthMonitoring?: boolean;

  /**
   * Health check interval in milliseconds
   */
  healthCheckInterval?: number;

  /**
   * Enable slow query logging
   */
  enableSlowQueryLogging?: boolean;

  /**
   * Slow query threshold in milliseconds
   */
  slowQueryThreshold?: number;

  /**
   * Enable query cache
   */
  enableQueryCache?: boolean;

  /**
   * Query cache duration in milliseconds
   */
  queryCacheDuration?: number;

  /**
   * Database connection pool settings
   */
  pool?: {
    min?: number;
    max?: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
}

/**
 * Database Health Check Service
 */
export interface DatabaseHealthService {
  /**
   * Checks database connection health
   * @returns Promise resolving to health status
   */
  check(): Promise<{
    status: 'healthy' | 'unhealthy';
    error?: string;
    timestamp: string;
  }>;

  /**
   * Gets detailed database statistics
   * @returns Promise resolving to database statistics
   */
  getStats(): Promise<{
    connections: number;
    activeConnections: number;
    totalConnections: number;
    idleConnections: number;
    queryCount: number;
    averageQueryTime: number;
  }>;

  /**
   * Performs database health diagnostics
   * @returns Promise resolving to diagnostic information
   */
  diagnose(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
    }>;
    timestamp: string;
  }>;
}

/**
 * Transaction Manager Service
 */
export interface TransactionManagerService {
  /**
   * Executes operations within a transaction
   * @param operations Array of operations to execute
   * @returns Promise resolving to transaction result
   */
  runTransaction<T>(
    operations: (manager: any) => Promise<T>
  ): Promise<T>;

  /**
   * Creates a transaction runner
   * @returns Transaction runner instance
   */
  createTransaction(): any;

  /**
   * Rolls back a transaction
   * @param transaction Transaction to rollback
   * @returns Promise resolving when rollback is complete
   */
  rollback(transaction: any): Promise<void>;

  /**
   * Commits a transaction
   * @param transaction Transaction to commit
   * @returns Promise resolving when commit is complete
   */
  commit(transaction: any): Promise<void>;
}

/**
 * Migration Service
 */
export interface MigrationService {
  /**
   * Runs pending migrations
   * @returns Promise resolving to migration results
   */
  runMigrations(): Promise<{
    executed: string[];
    pending: string[];
  }>;

  /**
   * Reverts the last migration
   * @returns Promise resolving to revert status
   */
  revertMigration(): Promise<boolean>;

  /**
   * Generates a new migration file
   * @param name Migration name
   * @returns Promise resolving to migration file path
   */
  generateMigration(name: string): Promise<string>;

  /**
   * Gets migration status
   * @returns Promise resolving to migration status
   */
  getMigrationStatus(): Promise<{
    executed: Array<{ name: string; executedAt: Date }>;
    pending: string[];
  }>;
}

/**
 * Query Cache Service
 */
export interface QueryCacheService {
  /**
   * Caches query results
   * @param key Cache key
   * @param query Query function
   * @param ttl Time to live in seconds
   * @returns Promise resolving to cached query result
   */
  getOrSet<T>(
    key: string,
    query: () => Promise<T>,
    ttl?: number
  ): Promise<T>;

  /**
   * Invalidates cache entry
   * @param key Cache key
   * @returns Promise resolving to invalidation status
   */
  invalidate(key: string): Promise<boolean>;

  /**
   * Clears all cache entries
   * @returns Promise resolving to clear status
   */
  clear(): Promise<boolean>;

  /**
   * Gets cache statistics
   * @returns Promise resolving to cache statistics
   */
  getStats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }>;
}