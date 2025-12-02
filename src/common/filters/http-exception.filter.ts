import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * HTTP Exception Filter
 *
 * Global exception filter that catches and formats HTTP exceptions.
 * Provides consistent error response format and logging capabilities.
 *
 * Features:
 * - Standardized error response format
 * - Detailed error logging
 * - Stack trace filtering in production
 * - Request context information
 * - Custom error messages
 * - Validation error handling
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Catches and handles HTTP exceptions
   *
   * @param exception The thrown exception
   * @param host The arguments host
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let details: any = null;
    let code: string = null;

    // Determine if this is a known HTTP exception
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle different response types
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;
        details = responseObj.details || responseObj.errors || null;
        code = responseObj.code || null;
      } else {
        message = exception.message;
      }
    } else {
      // Handle unknown exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      details = this.isDevelopment() ? (exception as Error).message : null;
      code = 'INTERNAL_ERROR';
    }

    // Build standardized error response
    const errorResponse = this.buildErrorResponse(exception, request, status, message, details, code);

    // Log the error with context
    this.logError(exception, request, errorResponse);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Builds standardized error response object
   *
   * @param exception The original exception
   * @param request The HTTP request
   * @param status HTTP status code
   * @param message Error message
   * @param details Additional error details
   * @param code Error code
   * @returns Standardized error response object
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
    status: HttpStatus,
    message: string,
    details: any,
    code: string
  ): any {
    const baseResponse = {
      success: false,
      message: this.sanitizeMessage(message, status),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
    };

    // Add error code if available
    if (code) {
      baseResponse['code'] = code;
    }

    // Add details if available and appropriate
    if (details) {
      if (Array.isArray(details)) {
        baseResponse['errors'] = details.map((error) => this.formatError(error));
      } else if (typeof details === 'object') {
        baseResponse['details'] = details;
      } else {
        baseResponse['details'] = details;
      }
    }

    // Add stack trace in development
    if (this.isDevelopment() && exception instanceof Error) {
      baseResponse['stack'] = exception.stack;
    }

    // Add request information
    if (this.isDevelopment()) {
      baseResponse['request'] = {
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        params: request.params,
        body: this.sanitizeBody(request.body),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      };
    }

    // Add correlation ID if available
    const correlationId = request.headers['x-correlation-id'] as string;
    if (correlationId) {
      baseResponse['correlationId'] = correlationId;
    }

    return baseResponse;
  }

  /**
   * Formats error objects for consistent response
   *
   * @param error Error object to format
   * @returns Formatted error object
   */
  private formatError(error: any): any {
    if (typeof error === 'string') {
      return { message: error };
    } else if (error && typeof error === 'object') {
      return {
        field: error.property || error.field || null,
        message: error.message || error.toString(),
        constraints: error.constraints || null,
        value: error.value || null,
      };
    } else {
      return { message: String(error) };
    }
  }

  /**
   * Sanitizes error messages for security
   *
   * @param message Original error message
   * @param status HTTP status code
   * @returns Sanitized error message
   */
  private sanitizeMessage(message: string, status: HttpStatus): string {
    // Don't expose internal error details in production for 500 errors
    if (!this.isDevelopment() && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'An unexpected error occurred';
    }

    // Remove potential sensitive information
    return message.replace(/password/gi, '****')
                .replace(/secret/gi, '****')
                .replace(/token/gi, '****')
                .replace(/key/gi, '****');
  }

  /**
   * Sanitizes request headers for logging
   *
   * @param headers Request headers
   * @returns Sanitized headers object
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-secret'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '****';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes request body for logging
   *
   * @param body Request body
   * @returns Sanitized body object
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '****';
      }
    });

    return sanitized;
  }

  /**
   * Logs errors with appropriate severity and context
   *
   * @param exception The original exception
   * @param request The HTTP request
   * @param errorResponse The error response object
   */
  private logError(exception: unknown, request: Request, errorResponse: any): void {
    const context = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      correlationId: request.headers['x-correlation-id'],
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
    };

    const message = `${request.method} ${request.url} - ${errorResponse.statusCode} - ${errorResponse.message}`;

    if (exception instanceof HttpException) {
      if (errorResponse.statusCode >= 500) {
        this.logger.error(message, exception.stack, context);
      } else if (errorResponse.statusCode >= 400) {
        this.logger.warn(message, context);
      } else {
        this.logger.debug(message, context);
      }
    } else {
      // Unknown exception - always log as error
      this.logger.error(message, exception instanceof Error ? exception.stack : exception, context);
    }
  }

  /**
   * Checks if the application is running in development mode
   *
   * @returns True if in development mode
   */
  private isDevelopment(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  /**
   * Checks if the application is running in test mode
   *
   * @returns True if in test mode
   */
  private isTest(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'test';
  }

  /**
   * Checks if detailed error information should be included
   *
   * @returns True if details should be included
   */
  private includeDetails(): boolean {
    return this.isDevelopment() || this.isTest();
  }
}