import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';
import { createSwaggerDocumentBuilder, swaggerConfig } from './config/swagger.config';

/**
 * Bootstrap function
 *
 * Configures and starts the NestJS application with optimized performance,
 * security settings, middleware, and graceful shutdown handling.
 */
async function bootstrap() {
  const startTime = Date.now();
  const logger = new Logger('Bootstrap');

  try {
    // Create application with optimized settings
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'debug', 'log'], // Configurable log levels
      bufferLogs: true, // Enable log buffering for performance
      autoFlushLogs: true, // Automatically flush logs
    });

    const configService = app.get(ConfigService);

    // Apply global interceptors (order matters)
    app.useGlobalInterceptors(
      new LoggingInterceptor(configService), // First: logging interceptor
      new ResponseInterceptor(configService), // Second: response formatting
    );

    // Apply global filters
    app.useGlobalFilters(new HttpExceptionFilter(configService));

    // Apply custom validation pipe with enhanced features
    app.useGlobalPipes(
      new CustomValidationPipe(configService),
    );

    // Enable compression for response bodies
    app.use(compression({
      level: configService.get<number>('compression.level', 6),
      threshold: configService.get<number>('compression.threshold', 1024),
      filter: (req, res) => {
        // Skip compression for certain content types
        const skipTypes = ['image/svg+xml', 'application/octet-stream'];
        return !skipTypes.includes(res.getHeader('content-type') as string);
      },
    }));

    // Apply security headers
    app.use(helmet({
      contentSecurityPolicy: configService.get<boolean>('helmet.csp', true) ? undefined : false,
      hsts: {
        maxAge: configService.get<number>('helmet.hsts.maxAge', 31536000),
        includeSubDomains: configService.get<boolean>('helmet.hsts.subdomains', true),
        preload: configService.get<boolean>('helmet.hsts.preload', false),
      },
      crossOriginEmbedderPolicy: configService.get<boolean>('helmet.coep', false),
      crossOriginOpenerPolicy: configService.get<boolean>('helmet.coop', false),
      crossOriginResourcePolicy: configService.get<boolean>('helmet.corp', false),
    }));

    // Configure CORS with advanced options
    const corsOrigins = configService.get<string[] | string>('cors.origin', [
      'http://localhost:3000',
      'http://localhost:3001',
    ]);

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list or if wildcard is configured
        if (corsOrigins === '*' || corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: configService.get<boolean>('cors.credentials', true),
      methods: configService.get<string[]>('cors.methods', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
      allowedHeaders: configService.get<string[]>('cors.allowedHeaders', [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID',
        'X-API-Key',
      ]),
      exposedHeaders: configService.get<string[]>('cors.exposedHeaders', [
        'X-Total-Count',
        'X-Page-Count',
        'X-Correlation-ID',
      ]),
      maxAge: configService.get<number>('cors.maxAge', 86400), // 24 hours
    });

    // Configure API prefix
    const globalPrefix = configService.get<string>('app.globalPrefix', 'api');
    app.setGlobalPrefix(globalPrefix);

    // Configure Swagger/OpenAPI documentation
    const enableSwagger = configService.get<boolean>('swagger.enabled', true);
    if (enableSwagger) {
      const documentBuilder = createSwaggerDocumentBuilder();
      const document = SwaggerModule.createDocument(app, documentBuilder);

      SwaggerModule.setup(
        configService.get<string>('swagger.path', '/api/docs'),
        app,
        document,
        swaggerConfig,
      );

      logger.log(`📚 API Documentation available at: /api/docs`);
    }

    // Health check endpoint for load balancers
    app.getHttpAdapter().get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: configService.get<string>('app.version', '1.0.0'),
      });
    });

    // Readiness probe for Kubernetes
    app.getHttpAdapter().get('/ready', (req, res) => {
      res.status(200).json({ status: 'ready' });
    });

    // Liveness probe for Kubernetes
    app.getHttpAdapter().get('/live', (req, res) => {
      res.status(200).json({ status: 'alive' });
    });

    // Get port configuration
    const port = configService.get<number>('app.port', 3001);
    const host = configService.get<string>('app.host', '0.0.0.0');

    // Configure graceful shutdown
    const shutdownTimeout = configService.get<number>('app.shutdownTimeout', 10000);

    app.enableShutdownHooks();

    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received. Starting graceful shutdown...');
      await gracefulShutdown(app, shutdownTimeout, logger);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received. Starting graceful shutdown...');
      await gracefulShutdown(app, shutdownTimeout, logger);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown(app, shutdownTimeout, logger);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Start the application
    await app.listen(port, host);

    const startupTime = Date.now() - startTime;

    // Log startup information
    logger.log('🚀 Application started successfully', {
      port,
      host,
      globalPrefix,
      environment: configService.get<string>('NODE_ENV', 'development'),
      startupTime: `${startupTime}ms`,
      processId: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    });

    logger.log(`🌐 Server listening on: http://${host}:${port}/${globalPrefix}`);
    logger.log(`🔍 Health checks: http://${host}:${port}/health`);

    if (enableSwagger) {
      logger.log(`📚 API Documentation: http://${host}:${port}/api/docs`);
    }

    // Send startup notification if configured
    await sendStartupNotification(configService, {
      port,
      host,
      startupTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 *
 * @param app NestJS application instance
 * @param timeout Shutdown timeout in milliseconds
 * @param logger Logger instance
 */
async function gracefulShutdown(app: any, timeout: number, logger: Logger): Promise<void> {
  try {
    logger.log('🔄 Starting graceful shutdown...');
    const startTime = Date.now();

    // Close HTTP server
    await app.close();

    const shutdownTime = Date.now() - startTime;
    logger.log(`✅ Graceful shutdown completed in ${shutdownTime}ms`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Sends startup notification if configured
 *
 * @param configService Configuration service
 * @param info Startup information
 */
async function sendStartupNotification(configService: ConfigService, info: any): Promise<void> {
  try {
    const webhookUrl = configService.get<string>('notifications.startupWebhook');
    if (!webhookUrl) {
      return;
    }

    // In a real implementation, you would send HTTP request to webhook
    logger.log('📤 Startup notification sent', { webhook: webhookUrl, info });
  } catch (error) {
    logger.warn('Failed to send startup notification:', error.message);
  }
}

/**
 * Monitor memory usage and log warnings
 */
function startMemoryMonitoring(): void {
  const memoryThreshold = 0.8; // 80% of total memory

  setInterval(() => {
    const used = process.memoryUsage();
    const total = require('os').totalmem();
    const usage = used.heapUsed / total;

    if (usage > memoryThreshold) {
      const logger = new Logger('MemoryMonitor');
      logger.warn(`High memory usage detected: ${(usage * 100).toFixed(2)}%`, {
        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(used.external / 1024 / 1024) + 'MB',
      });
    }
  }, 30000); // Check every 30 seconds
}

// Start memory monitoring
startMemoryMonitoring();

// Bootstrap the application
bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
