import { DynamicModule, Global, Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health Module
 *
 * Provides comprehensive health monitoring capabilities including:
 * - Application health status
 * - Database connectivity checks
 * - External service health checks
 * - System resource monitoring
 * - Performance metrics
 * - Readiness and Liveness probes
 *
 * This module is global and provides health endpoints for monitoring and
 * orchestration systems like Kubernetes, Docker, and load balancers.
 */
@Global()
@Module({})
export class HealthModule {
  /**
   * Configures and returns the health module
   *
   * @param options Optional configuration options for health monitoring
   * @returns DynamicModule configured health module
   */
  static forRoot(options?: HealthModuleOptions): DynamicModule {
    const providers = [
      HealthService,
      {
        provide: 'HEALTH_OPTIONS',
        useValue: options || {},
      },
    ];

    const controllers = [HealthController];
    const exports = [HealthService];

    return {
      module: HealthModule,
      controllers,
      providers,
      exports,
    };
  }

  /**
   * Configures health module with custom health indicators
   *
   * @param indicators Array of custom health indicators
   * @returns DynamicModule with custom indicators
   */
  static forFeature(indicators: HealthIndicator[] = []): DynamicModule {
    const providers = [
      ...indicators.map((indicator) => ({
        provide: indicator.name,
        useClass: indicator.class,
      })),
    ];

    return {
      module: HealthModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Health Module Configuration Options
 */
export interface HealthModuleOptions {
  /**
   * Enable detailed health information
   * Default: false (basic health only)
   */
  enableDetailed?: boolean;

  /**
   * Enable performance metrics
   * Default: true
   */
  enableMetrics?: boolean;

  /**
   * Enable system resource monitoring
   * Default: true
   */
  enableSystemMetrics?: boolean;

  /**
   * Enable database health checks
   * Default: true
   */
  enableDatabaseCheck?: boolean;

  /**
   * Enable memory usage monitoring
   * Default: true
   */
  enableMemoryCheck?: boolean;

  /**
   * Enable CPU usage monitoring
   * Default: true
   */
  enableCpuCheck?: boolean;

  /**
   * Enable disk space monitoring
   * Default: true
   */
  enableDiskCheck?: boolean;

  /**
   * Custom health check interval in milliseconds
   * Default: 30000 (30 seconds)
   */
  checkInterval?: number;

  /**
   * Health check timeout in milliseconds
   * Default: 5000 (5 seconds)
   */
  checkTimeout?: number;

  /**
   * Memory usage threshold (percentage)
   * Default: 80
   */
  memoryThreshold?: number;

  /**
   * CPU usage threshold (percentage)
   * Default: 75
   */
  cpuThreshold?: number;

  /**
   * Disk space threshold (percentage)
   * Default: 90
   */
  diskThreshold?: number;

  /**
   * Custom health indicators
   */
  indicators?: HealthIndicator[];

  /**
   * Enable health endpoints
   * Default: true
   */
  enableEndpoints?: boolean;

  /**
   * Health check endpoints
   */
  endpoints?: {
    liveness?: string;
    readiness?: string;
    health?: string;
    metrics?: string;
  };

  /**
   * Enable health history
   * Default: false
   */
  enableHistory?: boolean;

  /**
   * Health history retention period in hours
   * Default: 24
   */
  historyRetention?: number;

  /**
   * Enable health notifications
   * Default: false
   */
  enableNotifications?: boolean;

  /**
   * Notification providers
   */
  notifications?: {
    email?: {
      enabled: boolean;
      recipients: string[];
      smtpConfig?: any;
    };
    slack?: {
      enabled: boolean;
      webhookUrl: string;
      channel?: string;
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
  };

  /**
   * Grace period for startup (seconds)
   * Default: 30
   */
  startupGracePeriod?: number;

  /**
   * Grace period for shutdown (seconds)
   * Default: 10
   */
  shutdownGracePeriod?: number;
}

/**
 * Health Indicator Configuration
 */
export interface HealthIndicator {
  /**
   * Name of the health indicator
   */
  name: string;

  /**
   * Health indicator class
   */
  class: any;

  /**
   * Check interval in milliseconds
   */
  interval?: number;

  /**
   * Check timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable/disable the indicator
   */
  enabled?: boolean;

  /**
   * Required for overall health to pass
   */
  critical?: boolean;

  /**
   * Custom configuration for the indicator
   */
  config?: Record<string, any>;
}

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  /**
   * Overall health status
   */
  status: 'healthy' | 'unhealthy' | 'degraded';

  /**
   * Timestamp of the health check
   */
  timestamp: string;

  /**
   * Duration of health check in milliseconds
   */
  duration?: number;

  /**
   * Application version
   */
  version?: string;

  /**
   * Application uptime in seconds
   */
  uptime?: number;

  /**
   * Individual health indicator results
   */
  details?: Record<string, HealthIndicatorResult>;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * Health check summary
   */
  summary?: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
    disabled: number;
  };
}

/**
 * Individual Health Indicator Result
 */
export interface HealthIndicatorResult {
  /**
   * Status of this indicator
   */
  status: 'pass' | 'fail' | 'warn';

  /**
   * Human-readable message
   */
  message?: string;

  /**
   * Duration of this check in milliseconds
   */
  duration?: number;

  /**
   * Additional data from the indicator
   */
  data?: Record<string, any>;

  /**
   * Error information if check failed
   */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };

  /**
   * Last successful check timestamp
   */
  lastSuccess?: string;

  /**
   * Last failure timestamp
   */
  lastFailure?: string;

  /**
   * Consecutive failures count
   */
  consecutiveFailures?: number;

  /**
   * Whether this indicator is critical for overall health
   */
  critical?: boolean;
}

/**
 * System Metrics
 */
export interface SystemMetrics {
  /**
   * Memory usage information
   */
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
    heapTotal?: number;
    heapUsed?: number;
    external?: number;
    rss?: number;
  };

  /**
   * CPU usage information
   */
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };

  /**
   * Disk usage information
   */
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
    path?: string;
  };

  /**
   * Network information
   */
  network?: {
    interfaces: Array<{
      name: string;
      type: string;
      speed?: number;
      bytesReceived?: number;
      bytesSent?: number;
    }>;
  };

  /**
   * Process information
   */
  process: {
    pid: number;
    uptime: number;
    version: string;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  /**
   * Request metrics
   */
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    requestsPerSecond: number;
  };

  /**
   * Database metrics
   */
  database?: {
    connections: number;
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
  };

  /**
   * Cache metrics
   */
  cache?: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };

  /**
   * Custom metrics
   */
  custom?: Record<string, number>;
}

/**
 * Health Notification Data
 */
export interface HealthNotificationData {
  /**
   * Type of notification
   */
  type: 'alert' | 'recovery' | 'degraded';

  /**
   * Health status
   */
  status: 'healthy' | 'unhealthy' | 'degraded';

  /**
   * Message
   */
  message: string;

  /**
   * Timestamp
   */
  timestamp: string;

  /**
   * Affected indicators
   */
  indicators?: string[];

  /**
   * Health check results
   */
  results?: HealthCheckResult;

  /**
   * Application information
   */
  application: {
    name: string;
    version: string;
    environment: string;
  };
}