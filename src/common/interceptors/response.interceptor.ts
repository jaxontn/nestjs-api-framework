import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Response Interceptor
 *
 * Standardizes all HTTP responses with a consistent format.
 * Provides metadata, timestamps, and success indicators for all responses.
 *
 * Features:
 * - Consistent response format
 * - Metadata inclusion (pagination, counts, etc.)
 * - Timestamps for response tracking
 * - Request context information
 * - Performance metrics
 * - Correlation ID support
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Intercepts and transforms responses
   *
   * @param context The execution context
   * @param next The call handler
   * @returns Observable with transformed response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;

        // If the response is already in standard format, just add metadata
        if (data && typeof data === 'object' && 'success' in data) {
          return this.enhanceExistingResponse(data, request, response, duration);
        }

        // Convert to standard format
        return this.formatResponse(data, request, response, duration);
      })
    );
  }

  /**
   * Formats response data into standard format
   *
   * @param data The response data
   * @param request The HTTP request
   * @param response The HTTP response
   * @param duration Request processing duration
   * @returns Formatted response object
   */
  private formatResponse(
    data: any,
    request: Request,
    response: Response,
    duration: number
  ): any {
    const baseResponse = {
      success: true,
      message: this.getSuccessMessage(request.method, request.route?.path),
      data: this.normalizeData(data),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: response.statusCode,
    };

    // Add metadata if available
    const metadata = this.extractMetadata(data);
    if (metadata) {
      baseResponse['metadata'] = metadata;
    }

    // Add performance information
    if (this.includePerformanceMetrics()) {
      baseResponse['performance'] = {
        duration: `${duration}ms`,
        timestamp: Date.now(),
      };
    }

    // Add correlation ID if available
    const correlationId = request.headers['x-correlation-id'] as string;
    if (correlationId) {
      baseResponse['correlationId'] = correlationId;
    }

    // Add request information in development
    if (this.isDevelopment()) {
      baseResponse['request'] = {
        query: request.query,
        params: request.params,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      };
    }

    return baseResponse;
  }

  /**
   * Enhances existing formatted response
   *
   * @param data Existing response data
   * @param request The HTTP request
   * @param response The HTTP response
   * @param duration Request processing duration
   * @returns Enhanced response object
   */
  private enhanceExistingResponse(
    data: any,
    request: Request,
    response: Response,
    duration: number
  ): any {
    const enhanced = { ...data };

    // Add timestamp if not present
    if (!enhanced.timestamp) {
      enhanced.timestamp = new Date().toISOString();
    }

    // Add path if not present
    if (!enhanced.path) {
      enhanced.path = request.url;
    }

    // Add method if not present
    if (!enhanced.method) {
      enhanced.method = request.method;
    }

    // Add status code if not present
    if (!enhanced.statusCode) {
      enhanced.statusCode = response.statusCode;
    }

    // Add performance information
    if (this.includePerformanceMetrics()) {
      enhanced.performance = {
        duration: `${duration}ms`,
        timestamp: Date.now(),
        ...(enhanced.performance || {}),
      };
    }

    // Add correlation ID if available
    const correlationId = request.headers['x-correlation-id'] as string;
    if (correlationId) {
      enhanced.correlationId = correlationId;
    }

    return enhanced;
  }

  /**
   * Normalizes response data for consistent format
   *
   * @param data Raw response data
   * @returns Normalized data
   */
  private normalizeData(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (typeof data === 'object') {
      // If data already has pagination structure, preserve it
      if (data.data && data.pagination) {
        return data;
      }

      // If data is an array, keep it as is
      if (Array.isArray(data)) {
        return data;
      }

      // If data is an object, return it as is
      return data;
    }

    // For primitive types, wrap in object
    return { value: data };
  }

  /**
   * Extracts metadata from response data
   *
   * @param data Response data
   * @returns Metadata object or null
   */
  private extractMetadata(data: any): any {
    const metadata: any = {};

    // Pagination metadata
    if (data && typeof data === 'object' && data.pagination) {
      metadata.pagination = data.pagination;
    }

    // Count metadata
    if (Array.isArray(data)) {
      metadata.count = data.length;
      metadata.type = 'array';
    } else if (data && typeof data === 'object') {
      metadata.type = 'object';

      // Add keys count for objects
      const keys = Object.keys(data);
      metadata.keys = keys.length;

      // Remove system keys from metadata
      if (keys.includes('data') && keys.includes('pagination')) {
        metadata.type = 'paginated';
      }
    } else {
      metadata.type = typeof data;
    }

    // Return null if no meaningful metadata
    return Object.keys(metadata).length > 0 ? metadata : null;
  }

  /**
   * Generates appropriate success message based on HTTP method and route
   *
   * @param method HTTP method
   * @param path Route path
   * @returns Success message string
   */
  private getSuccessMessage(method: string, path?: string): string {
    const messages: Record<string, string> = {
      GET: 'Data retrieved successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };

    // Get default message or use a generic one
    const defaultMessage = messages[method] || 'Request completed successfully';

    // Customize based on path if available
    if (path) {
      const pathSegments = path.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (lastSegment && method === 'GET') {
        // Specific messages for common endpoints
        const specificMessages: Record<string, string> = {
          'health': 'Health check successful',
          'metrics': 'Metrics retrieved successfully',
          'status': 'Status retrieved successfully',
          'info': 'Information retrieved successfully',
          'search': 'Search completed successfully',
          'count': 'Count retrieved successfully',
          'statistics': 'Statistics retrieved successfully',
        };

        if (specificMessages[lastSegment]) {
          return specificMessages[lastSegment];
        }
      }
    }

    return defaultMessage;
  }

  /**
   * Checks if performance metrics should be included
   *
   * @returns True if metrics should be included
   */
  private includePerformanceMetrics(): boolean {
    return this.configService.get<boolean>('response.includeMetrics', true);
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
   * Checks if detailed response information should be included
   *
   * @returns True if details should be included
   */
  private includeDetails(): boolean {
    return this.isDevelopment() ||
           this.configService.get<boolean>('response.includeDetails', false);
  }
}