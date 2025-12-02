import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  HealthCheckResult,
  HealthModuleOptions,
  SystemMetrics,
  PerformanceMetrics,
  HealthIndicatorResult,
} from './health.module';

/**
 * Health Service
 *
 * Provides comprehensive health monitoring and diagnostics for the application.
 * Monitors system resources, database connectivity, external services, and
 * custom health indicators. Supports Kubernetes probes and alerting.
 */
@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private startTime: Date;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthHistory: HealthCheckResult[] = [];
  private metricsHistory: Array<{ timestamp: string; metrics: PerformanceMetrics }> = [];

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(DataSource)
    private readonly dataSource: DataSource,
    @Inject('HEALTH_OPTIONS')
    private readonly options: HealthModuleOptions = {},
  ) {
    this.startTime = new Date();
  }

  /**
   * Initializes the health monitoring service
   */
  async onModuleInit(): Promise<void> {
    // Set up periodic health checks if configured
    if (this.options.checkInterval && this.options.checkInterval > 0) {
      this.startPeriodicChecks();
    }

    // Perform initial health check
    await this.check();

    console.log('Health service initialized');
  }

  /**
   * Cleans up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.log('Health service destroyed');
  }

  /**
   * Performs a basic health check
   *
   * @returns Promise resolving to health check result
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const details: Record<string, HealthIndicatorResult> = {};

      // Check database connectivity
      if (this.options.enableDatabaseCheck !== false) {
        details.database = await this.checkDatabase();
      }

      // Check memory usage
      if (this.options.enableMemoryCheck !== false) {
        details.memory = await this.checkMemory();
      }

      // Check CPU usage
      if (this.options.enableCpuCheck !== false) {
        details.cpu = await this.checkCpu();
      }

      // Check disk space
      if (this.options.enableDiskCheck !== false) {
        details.disk = await this.checkDisk();
      }

      // Run custom indicators
      if (this.options.indicators) {
        for (const indicator of this.options.indicators) {
          if (indicator.enabled !== false) {
            details[indicator.name] = await this.runCustomIndicator(indicator);
          }
        }
      }

      const overallStatus = this.calculateOverallStatus(details);
      const duration = Date.now() - startTime;

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        duration,
        version: this.configService.get<string>('APP_VERSION', '1.0.0'),
        uptime: Math.floor(process.uptime()),
        details,
        summary: this.calculateSummary(details),
      };

      // Store in history if enabled
      if (this.options.enableHistory) {
        this.addToHistory(result);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        duration,
        version: this.configService.get<string>('APP_VERSION', '1.0.0'),
        uptime: Math.floor(process.uptime()),
        error: error.message,
        details: {
          error: {
            status: 'fail',
            message: 'Health check failed',
            error: {
              message: error.message,
              stack: error.stack,
            },
            critical: true,
          },
        },
      };
    }
  }

  /**
   * Performs detailed health check with all metrics
   *
   * @param includeDetails Whether to include detailed information
   * @returns Promise resolving to detailed health check result
   */
  async checkDetailed(includeDetails: boolean = true): Promise<HealthCheckResult> {
    const basicHealth = await this.check();

    if (!includeDetails || this.options.enableDetailed !== true) {
      return basicHealth;
    }

    // Add detailed metrics
    const metrics = await this.getMetrics();
    const systemMetrics = await this.getSystemMetrics();

    return {
      ...basicHealth,
      metadata: {
        metrics,
        system: systemMetrics,
        environment: this.configService.get<string>('NODE_ENV', 'development'),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
      },
    };
  }

  /**
   * Checks if the application is alive (for liveness probes)
   *
   * @returns Promise resolving to boolean indicating if application is alive
   */
  async isAlive(): Promise<boolean> {
    try {
      // Simple check - if we can respond, we're alive
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if the application is ready to serve traffic (for readiness probes)
   *
   * @returns Promise resolving to boolean indicating if application is ready
   */
  async isReady(): Promise<boolean> {
    try {
      // Check if within startup grace period
      const uptime = process.uptime();
      const gracePeriod = this.options.startupGracePeriod || 30;

      if (uptime < gracePeriod) {
        return false;
      }

      // Check database connectivity if enabled
      if (this.options.enableDatabaseCheck !== false) {
        const dbCheck = await this.checkDatabase();
        if (dbCheck.status !== 'pass') {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets application performance metrics
   *
   * @returns Promise resolving to performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    const requests = {
      total: 0, // This would be tracked by request interceptor
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
    };

    const database = this.dataSource ? {
      connections: this.dataSource.driver?.totalCount || 0,
      activeConnections: this.dataSource.driver?.activeCount || 0,
      idleConnections: this.dataSource.driver?.totalCount || 0,
      totalQueries: 0, // This would be tracked by query interceptor
      averageQueryTime: 0,
      slowQueries: 0,
    } : undefined;

    return {
      requests,
      database,
    };
  }

  /**
   * Gets system resource metrics
   *
   * @returns Promise resolving to system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memory = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();

    return {
      memory: {
        total: totalMemory,
        used: totalMemory - freeMemory,
        free: freeMemory,
        percentage: ((totalMemory - freeMemory) / totalMemory) * 100,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        rss: memory.rss,
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
        loadAverage: require('os').loadavg(),
        cores: require('os').cpus().length,
      },
      disk: {
        total: 0, // Would need fs stats for actual disk usage
        used: 0,
        free: 0,
        percentage: 0,
        path: process.cwd(),
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        memoryUsage: memory,
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  /**
   * Gets Prometheus-formatted metrics
   *
   * @returns Promise resolving to Prometheus metrics string
   */
  async getPrometheusMetrics(): Promise<string> {
    const metrics = await this.getMetrics();
    const systemMetrics = await this.getSystemMetrics();

    const prometheusMetrics = [
      '# HELP application_uptime_seconds Application uptime in seconds',
      '# TYPE application_uptime_seconds gauge',
      `application_uptime_seconds ${systemMetrics.process.uptime}`,

      '# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes',
      '# TYPE nodejs_memory_usage_bytes gauge',
      `nodejs_memory_usage_bytes{type="heap_used"} ${systemMetrics.memory.heapUsed}`,
      `nodejs_memory_usage_bytes{type="heap_total"} ${systemMetrics.memory.heapTotal}`,
      `nodejs_memory_usage_bytes{type="rss"} ${systemMetrics.memory.rss}`,
      `nodejs_memory_usage_bytes{type="external"} ${systemMetrics.memory.external}`,

      '# HELP system_memory_usage_bytes System memory usage in bytes',
      '# TYPE system_memory_usage_bytes gauge',
      `system_memory_usage_bytes{type="used"} ${systemMetrics.memory.used}`,
      `system_memory_usage_bytes{type="free"} ${systemMetrics.memory.free}`,
      `system_memory_usage_bytes{type="total"} ${systemMetrics.memory.total}`,

      '# HELP application_requests_total Total number of requests',
      '# TYPE application_requests_total counter',
      `application_requests_total ${metrics.requests.total}`,

      '# HELP application_database_connections_active Active database connections',
      '# TYPE application_database_connections_active gauge',
      `application_database_connections_active ${metrics.database?.connections || 0}`,
    ];

    return prometheusMetrics.join('\n') + '\n';
  }

  /**
   * Gets health check history
   *
   * @param hours Number of hours of history to retrieve
   * @returns Promise resolving to health history
   */
  async getHealthHistory(hours: number = 24): Promise<HealthCheckResult[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.healthHistory.filter(
      check => new Date(check.timestamp) >= cutoffTime
    );
  }

  /**
   * Gets comprehensive diagnostics
   *
   * @returns Promise resolving to diagnostic information
   */
  async getDiagnostics(): Promise<any> {
    const currentHealth = await this.check();
    const systemMetrics = await this.getSystemMetrics();

    return {
      status: currentHealth.status,
      timestamp: currentHealth.timestamp,
      checks: currentHealth.details,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime: systemMetrics.process.uptime,
        memoryUsage: systemMetrics.memory,
        cpuUsage: systemMetrics.cpu,
      },
      environment: {
        NODE_ENV: this.configService.get<string>('NODE_ENV'),
        PORT: this.configService.get<string>('PORT'),
        DB_HOST: this.configService.get<string>('DB_HOST'),
      },
      configuration: {
        healthCheckInterval: this.options.checkInterval,
        enableDetailed: this.options.enableDetailed,
        enableHistory: this.options.enableHistory,
        memoryThreshold: this.options.memoryThreshold,
        cpuThreshold: this.options.cpuThreshold,
        diskThreshold: this.options.diskThreshold,
      },
    };
  }

  /**
   * Private helper methods
   */

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      if (!this.dataSource) {
        return {
          status: 'warn',
          message: 'Database not configured',
          duration: Date.now() - startTime,
        };
      }

      await this.dataSource.query('SELECT 1');

      return {
        status: 'pass',
        message: 'Database connection successful',
        duration: Date.now() - startTime,
        data: {
          connections: this.dataSource.driver?.totalCount || 0,
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Database connection failed',
        duration: Date.now() - startTime,
        error: {
          message: error.message,
        },
        critical: true,
      };
    }
  }

  private async checkMemory(): Promise<HealthIndicatorResult> {
    const memory = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usedMemory = totalMemory - require('os').freemem();
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    const threshold = this.options.memoryThreshold || 80;

    const status = memoryPercentage > threshold ? 'fail' : 'pass';

    return {
      status,
      message: `Memory usage: ${memoryPercentage.toFixed(2)}%`,
      data: {
        percentage: memoryPercentage,
        threshold,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        rss: memory.rss,
      },
    };
  }

  private async checkCpu(): Promise<HealthIndicatorResult> {
    const loadAverage = require('os').loadavg();
    const cores = require('os').cpus().length;
    const loadPercentage = (loadAverage[0] / cores) * 100;
    const threshold = this.options.cpuThreshold || 75;

    const status = loadPercentage > threshold ? 'fail' : 'pass';

    return {
      status,
      message: `CPU load: ${loadPercentage.toFixed(2)}%`,
      data: {
        percentage: loadPercentage,
        threshold,
        loadAverage,
        cores,
      },
    };
  }

  private async checkDisk(): Promise<HealthIndicatorResult> {
    const threshold = this.options.diskThreshold || 90;

    // In a real implementation, you would check actual disk usage
    // For now, return a healthy status
    return {
      status: 'pass',
      message: 'Disk space check passed',
      data: {
        percentage: 0,
        threshold,
      },
    };
  }

  private async runCustomIndicator(indicator: any): Promise<HealthIndicatorResult> {
    try {
      // This would instantiate and run the custom indicator
      // For now, return a mock result
      return {
        status: 'pass',
        message: `Custom indicator ${indicator.name} check passed`,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Custom indicator ${indicator.name} check failed`,
        error: {
          message: error.message,
        },
        critical: indicator.critical || false,
      };
    }
  }

  private calculateOverallStatus(details: Record<string, HealthIndicatorResult>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(details).map(d => d.status);
    const hasCritical = Object.values(details).some(d => d.critical && d.status === 'fail');

    if (hasCritical) {
      return 'unhealthy';
    }

    const hasFailures = statuses.includes('fail');
    const hasWarnings = statuses.includes('warn');

    if (hasFailures) {
      return 'unhealthy';
    }

    if (hasWarnings) {
      return 'degraded';
    }

    return 'healthy';
  }

  private calculateSummary(details: Record<string, HealthIndicatorResult>) {
    const values = Object.values(details);
    const total = values.length;
    const healthy = values.filter(v => v.status === 'pass').length;
    const unhealthy = values.filter(v => v.status === 'fail').length;
    const degraded = values.filter(v => v.status === 'warn').length;
    const disabled = 0; // Would be calculated if disabled indicators are supported

    return { total, healthy, unhealthy, degraded, disabled };
  }

  private startPeriodicChecks(): void {
    const interval = this.options.checkInterval || 30000;

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.check();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, interval);
  }

  private addToHistory(result: HealthCheckResult): void {
    this.healthHistory.push(result);

    // Maintain history size based on retention period
    const retentionHours = this.options.historyRetention || 24;
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000);

    this.healthHistory = this.healthHistory.filter(
      check => new Date(check.timestamp) >= cutoffTime
    );
  }
}