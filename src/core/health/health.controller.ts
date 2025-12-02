import {
  Controller,
  Get,
  HttpStatus,
  Res,
  Optional,
  Inject,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';
import {
  HealthCheckResult,
  HealthModuleOptions,
  SystemMetrics,
  PerformanceMetrics,
} from './health.module';

/**
 * Health Controller
 *
 * Provides health check endpoints for monitoring, load balancers,
 * and orchestration systems. Supports Kubernetes readiness/liveness probes,
 * Prometheus metrics, and custom health indicators.
 *
 * Endpoints:
 * - GET /health - Basic health check
 * - GET /health/liveness - Liveness probe (K8s)
 * - GET /health/readiness - Readiness probe (K8s)
 * - GET /health/detailed - Detailed health information
 * - GET /health/metrics - Application metrics
 * - GET /health/system - System metrics
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    @Optional()
    @Inject('HEALTH_OPTIONS')
    private readonly options: HealthModuleOptions = {},
  ) {}

  /**
   * Basic health check endpoint
   *
   * @param res HTTP response object
   * @returns HTTP response with health status
   */
  @Get()
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Returns basic health status of the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        version: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['unhealthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        error: { type: 'string' },
      },
    },
  })
  async healthCheck(@Res() res: Response): Promise<void> {
    try {
      const health = await this.healthService.check();
      const statusCode = this.getStatusCode(health.status);

      res.status(statusCode).json(health);
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  /**
   * Kubernetes liveness probe endpoint
   *
   * @param res HTTP response object
   * @returns HTTP response indicating if application is alive
   */
  @Get('liveness')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe to check if the application is alive',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not alive',
  })
  async livenessProbe(@Res() res: Response): Promise<void> {
    try {
      const isAlive = await this.healthService.isAlive();

      if (isAlive) {
        res.status(HttpStatus.OK).json({
          status: 'ok',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'not ok',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not ok',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  /**
   * Kubernetes readiness probe endpoint
   *
   * @param res HTTP response object
   * @returns HTTP response indicating if application is ready
   */
  @Get('readiness')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe to check if the application is ready to serve traffic',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ready'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready',
  })
  async readinessProbe(@Res() res: Response): Promise<void> {
    try {
      const isReady = await this.healthService.isReady();

      if (isReady) {
        res.status(HttpStatus.OK).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  /**
   * Detailed health check endpoint
   *
   * @param detailed Whether to include detailed information
   * @param res HTTP response object
   * @returns HTTP response with detailed health information
   */
  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Returns comprehensive health status with all indicators and metrics',
  })
  @ApiQuery({
    name: 'detailed',
    required: false,
    type: Boolean,
    description: 'Include detailed information about each health indicator',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
  })
  async detailedHealthCheck(
    @Query('detailed') detailed: string = 'true',
    @Res() res: Response,
  ): Promise<void> {
    try {
      const includeDetails = detailed === 'true' || detailed === '1';
      const health = await this.healthService.checkDetailed(includeDetails);
      const statusCode = this.getStatusCode(health.status);

      res.status(statusCode).json(health);
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  /**
   * Application metrics endpoint
   *
   * @param format Response format (json or prometheus)
   * @param res HTTP response object
   * @returns HTTP response with application metrics
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Application metrics',
    description: 'Returns application performance and usage metrics',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'prometheus'],
    description: 'Response format',
  })
  @ApiResponse({
    status: 200,
    description: 'Application metrics',
  })
  async getMetrics(
    @Query('format') format: string = 'json',
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (format === 'prometheus') {
        const prometheusMetrics = await this.healthService.getPrometheusMetrics();
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.status(HttpStatus.OK).send(prometheusMetrics);
      } else {
        const metrics = await this.healthService.getMetrics();
        res.status(HttpStatus.OK).json(metrics);
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * System metrics endpoint
   *
   * @param res HTTP response object
   * @returns HTTP response with system resource metrics
   */
  @Get('system')
  @ApiOperation({
    summary: 'System metrics',
    description: 'Returns system resource usage and performance metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics',
  })
  async getSystemMetrics(@Res() res: Response): Promise<void> {
    try {
      const metrics = await this.healthService.getSystemMetrics();
      res.status(HttpStatus.OK).json(metrics);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Health history endpoint
   *
   * @param hours Number of hours of history to retrieve
   * @param res HTTP response object
   * @returns HTTP response with health history data
   */
  @Get('history')
  @ApiOperation({
    summary: 'Health history',
    description: 'Returns historical health check data',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Number of hours of history to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Health history data',
  })
  async getHealthHistory(
    @Query('hours') hours: string = '24',
    @Res() res: Response,
  ): Promise<void> {
    try {
      const history = await this.healthService.getHealthHistory(
        parseInt(hours, 10)
      );
      res.status(HttpStatus.OK).json(history);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Health diagnostics endpoint
   *
   * @param res HTTP response object
   * @returns HTTP response with diagnostic information
   */
  @Get('diagnostics')
  @ApiOperation({
    summary: 'Health diagnostics',
    description: 'Returns comprehensive diagnostic information for troubleshooting',
  })
  @ApiResponse({
    status: 200,
    description: 'Diagnostic information',
  })
  async getDiagnostics(@Res() res: Response): Promise<void> {
    try {
      const diagnostics = await this.healthService.getDiagnostics();
      res.status(HttpStatus.OK).json(diagnostics);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Gets the appropriate HTTP status code based on health status
   *
   * @param status Health status
   * @returns HTTP status code
   */
  private getStatusCode(status: string): HttpStatus {
    switch (status) {
      case 'healthy':
        return HttpStatus.OK;
      case 'degraded':
        return HttpStatus.OK; // Still serve traffic, but indicate issues
      case 'unhealthy':
        return HttpStatus.SERVICE_UNAVAILABLE;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}