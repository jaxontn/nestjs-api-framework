import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Logging Interceptor
 *
 * Provides comprehensive request/response logging for monitoring and debugging.
 * Logs request details, response status, timing, and errors with configurable verbosity.
 *
 * Features:
 * - Request and response logging
 * - Performance timing
 * - Request/response body logging (in development)
 * - Error logging with context
 * - Structured logging support
 * - Log level filtering
 * - Sensitive data filtering
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Intercepts requests and responses for logging
   *
   * @param context The execution context
   * @param next The call handler
   * @returns Observable with logging side effects
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const correlationId = this.getCorrelationId(request);

    // Set correlation ID in response header
    response.setHeader('X-Correlation-ID', correlationId);

    // Log incoming request
    this.logIncomingRequest(request, correlationId);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logSuccessfulResponse(request, response, data, duration, correlationId);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logErrorResponse(request, response, error, duration, correlationId);
        throw error;
      })
    );
  }

  /**
   * Logs incoming request details
   *
   * @param request The HTTP request
   * @param correlationId Request correlation ID
   */
  private logIncomingRequest(request: Request, correlationId: string): void {
    const logData = {
      event: 'REQUEST',
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      query: this.sanitizeQuery(request.query),
      params: request.params,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      correlationId,
      timestamp: new Date().toISOString(),
    };

    // Add body for specific methods in development
    if (this.shouldLogBody(request.method) && this.isDevelopment()) {
      logData['body'] = this.sanitizeBody(request.body);
    }

    // Log at appropriate level based on request method
    const logLevel = this.getRequestLogLevel(request.method);
    this.logAtLevel(logLevel, `Incoming request: ${request.method} ${request.url}`, logData);
  }

  /**
   * Logs successful response details
   *
   * @param request The HTTP request
   * @param response The HTTP response
   * @param data Response data
   * @param duration Request duration in milliseconds
   * @param correlationId Request correlation ID
   */
  private logSuccessfulResponse(
    request: Request,
    response: Response,
    data: any,
    duration: number,
    correlationId: string
  ): void {
    const logData = {
      event: 'RESPONSE',
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      responseSize: this.getResponseSize(data),
      correlationId,
      timestamp: new Date().toISOString(),
    };

    // Add response data for debugging in development
    if (this.isDevelopment() && this.shouldLogResponseData(request.url)) {
      logData['responseData'] = this.sanitizeResponseData(data);
    }

    const message = `Request completed: ${request.method} ${request.url} - ${response.statusCode} (${duration}ms)`;
    this.logAtLevel(this.getSuccessLogLevel(response.statusCode), message, logData);

    // Log slow requests
    if (this.isSlowRequest(duration)) {
      this.logger.warn(`Slow request detected: ${duration}ms`, {
        method: request.method,
        url: request.url,
        duration,
        correlationId,
      });
    }
  }

  /**
   * Logs error response details
   *
   * @param request The HTTP request
   * @param response The HTTP response
   * @param error The error object
   * @param duration Request duration in milliseconds
   * @param correlationId Request correlation ID
   */
  private logErrorResponse(
    request: Request,
    response: Response,
    error: any,
    duration: number,
    correlationId: string
  ): void {
    const logData = {
      event: 'ERROR',
      method: request.method,
      url: request.url,
      statusCode: error.status || response.statusCode || 500,
      duration: `${duration}ms`,
      error: {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment() ? error.stack : undefined,
      },
      correlationId,
      timestamp: new Date().toISOString(),
    };

    // Add request details for error context
    if (this.isDevelopment()) {
      logData['request'] = {
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        params: request.params,
        body: this.sanitizeBody(request.body),
      };
    }

    const message = `Request failed: ${request.method} ${request.url} - ${logData.statusCode} (${duration}ms) - ${error.message}`;
    this.logger.error(message, error.stack, logData);
  }

  /**
   * Gets or generates a correlation ID for the request
   *
   * @param request The HTTP request
   * @returns Correlation ID string
   */
  private getCorrelationId(request: Request): string {
    // Check if correlation ID is provided in headers
    const existingId = request.headers['x-correlation-id'] as string;
    if (existingId) {
      return existingId;
    }

    // Check if correlation ID is provided in query parameters
    const queryId = request.query.correlationId as string;
    if (queryId) {
      return queryId;
    }

    // Generate new correlation ID
    return this.generateCorrelationId();
  }

  /**
   * Generates a new correlation ID
   *
   * @returns New correlation ID string
   */
  private generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  /**
   * Sanitizes request headers to remove sensitive information
   *
   * @param headers Request headers
   * @returns Sanitized headers object
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-secret',
      'x-token',
      'x-auth-token',
      'x-jwt-token',
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '****';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes query parameters to remove sensitive information
   *
   * @param query Query parameters
   * @returns Sanitized query object
   */
  private sanitizeQuery(query: any): any {
    const sanitized = { ...query };
    const sensitiveParams = ['token', 'key', 'secret', 'password', 'apiKey'];

    sensitiveParams.forEach(param => {
      if (sanitized[param]) {
        sanitized[param] = '****';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes request body to remove sensitive information
   *
   * @param body Request body
   * @returns Sanitized body object
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'token',
      'secret',
      'apiKey',
      'authToken',
      'jwt',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '****';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes response data to remove sensitive information
   *
   * @param data Response data
   * @returns Sanitized response data
   */
  private sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // For arrays, sanitize each item
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponseData(item));
    }

    const sanitized = { ...data };

    // Remove sensitive fields from response data
    const sensitiveFields = [
      'password',
      'salt',
      'hash',
      'token',
      'secret',
      'apiKey',
      'authToken',
      'jwt',
      'privateKey',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '****';
      }
    });

    return sanitized;
  }

  /**
   * Determines if request body should be logged
   *
   * @param method HTTP method
   * @returns True if body should be logged
   */
  private shouldLogBody(method: string): boolean {
    const bodyMethods = ['POST', 'PUT', 'PATCH'];
    return bodyMethods.includes(method.toUpperCase());
  }

  /**
   * Determines if response data should be logged
   *
   * @param url Request URL
   * @returns True if response data should be logged
   */
  private shouldLogResponseData(url: string): boolean {
    // Exclude large responses
    const excludedUrls = ['/metrics', '/logs', '/bulk', '/export'];
    return !excludedUrls.some(excluded => url.includes(excluded));
  }

  /**
   * Gets response size in bytes
   *
   * @param data Response data
   * @returns Response size in bytes
   */
  private getResponseSize(data: any): number {
    if (!data) {
      return 0;
    }
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }

  /**
   * Determines if request is considered slow
   *
   * @param duration Request duration in milliseconds
   * @returns True if request is slow
   */
  private isSlowRequest(duration: number): boolean {
    const threshold = this.configService.get<number>('logging.slowRequestThreshold', 1000);
    return duration > threshold;
  }

  /**
   * Gets appropriate log level based on request method
   *
   * @param method HTTP method
   * @returns Log level string
   */
  private getRequestLogLevel(method: string): 'log' | 'debug' | 'warn' | 'error' {
    const logLevels: Record<string, 'log' | 'debug' | 'warn' | 'error'> = {
      GET: 'debug',
      POST: 'log',
      PUT: 'log',
      PATCH: 'log',
      DELETE: 'warn',
    };

    return logLevels[method.toUpperCase()] || 'debug';
  }

  /**
   * Gets appropriate log level based on response status
   *
   * @param statusCode HTTP status code
   * @returns Log level string
   */
  private getSuccessLogLevel(statusCode: number): 'log' | 'debug' | 'warn' | 'error' {
    if (statusCode >= 200 && statusCode < 300) {
      return 'debug';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'log';
    } else if (statusCode >= 400) {
      return 'warn';
    }
    return 'debug';
  }

  /**
   * Logs message at specified level
   *
   * @param level Log level
   * @param message Log message
   * @param data Log data object
   */
  private logAtLevel(
    level: 'log' | 'debug' | 'warn' | 'error',
    message: string,
    data: any
  ): void {
    switch (level) {
      case 'debug':
        this.logger.debug(message, data);
        break;
      case 'warn':
        this.logger.warn(message, data);
        break;
      case 'error':
        this.logger.error(message, data);
        break;
      case 'log':
      default:
        this.logger.log(message, data);
        break;
    }
  }

  /**
   * Checks if application is running in development mode
   *
   * @returns True if in development mode
   */
  private isDevelopment(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  /**
   * Checks if application is running in test mode
   *
   * @returns True if in test mode
   */
  private isTest(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'test';
  }

  /**
   * Checks if detailed logging should be enabled
   *
   * @returns True if detailed logging should be enabled
   */
  private enableDetailedLogging(): boolean {
    return this.isDevelopment() ||
           this.configService.get<boolean>('logging.enableDetailed', false);
  }
}