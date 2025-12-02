/**
 * Standard API Response Interface
 *
 * Defines the structure for all API responses to ensure consistency
 * across the entire application. This interface is used by the response
 * interceptor and can be extended by specific endpoints as needed.
 */

/**
 * Base Response Interface
 * Standard format for all successful API responses
 */
export interface BaseResponse<T = any> {
  /**
   * Indicates if the request was successful
   */
  success: boolean;

  /**
   * Human-readable message describing the response
   */
  message: string;

  /**
   * Response data payload
   */
  data: T;

  /**
   * ISO timestamp of when the response was generated
   */
  timestamp: string;

  /**
   * Request path that generated this response
   */
  path: string;

  /**
   * HTTP method used for the request
   */
  method: string;

  /**
   * HTTP status code of the response
   */
  statusCode: number;

  /**
   * Optional correlation ID for request tracking
   */
  correlationId?: string;

  /**
   * Optional metadata about the response
   */
  metadata?: ResponseMetadata;

  /**
   * Optional performance metrics
   */
  performance?: PerformanceMetrics;

  /**
   * Optional request information (development only)
   */
  request?: RequestInfo;
}

/**
 * Error Response Interface
 * Standard format for all error responses
 */
export interface ErrorResponse extends BaseOmitData {
  /**
   * Indicates if the request was successful (always false for errors)
   */
  success: false;

  /**
   * Error message describing what went wrong
   */
  message: string;

  /**
   * Optional error code for programmatic error handling
   */
  code?: string;

  /**
   * Optional detailed error information
   */
  details?: ErrorDetails;

  /**
   * Optional validation errors
   */
  errors?: ValidationError[];

  /**
   * Optional error stack trace (development only)
   */
  stack?: string;
}

/**
 * Success Response Interface
 * Standard format for successful responses
 */
export interface SuccessResponse<T = any> extends BaseResponse<T> {
  /**
   * Indicates if the request was successful (always true for success)
   */
  success: true;

  /**
   * Success message
   */
  message: string;

  /**
   * Response data
   */
  data: T;
}

/**
 * Base interface without data field
 */
export interface BaseOmitData {
  success: boolean;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
  correlationId?: string;
  metadata?: ResponseMetadata;
  performance?: PerformanceMetrics;
  request?: RequestInfo;
}

/**
 * Response Metadata Interface
 * Additional information about the response
 */
export interface ResponseMetadata {
  /**
   * Type of response data
   */
  type?: 'array' | 'object' | 'paginated' | 'primitive' | 'null';

  /**
   * Number of items in response (for arrays)
   */
  count?: number;

  /**
   * Number of keys in response (for objects)
   */
  keys?: number;

  /**
   * Response size in bytes
   */
  size?: number;

  /**
   * Response encoding
   */
  encoding?: string;

  /**
   * Response content type
   */
  contentType?: string;

  /**
   * Version of the API
   */
  version?: string;

  /**
   * Optional pagination information
   */
  pagination?: PaginationMetadata;
}

/**
 * Performance Metrics Interface
 * Performance information about the request processing
 */
export interface PerformanceMetrics {
  /**
   * Request processing duration
   */
  duration: string;

  /**
   * Timestamp when processing started
   */
  timestamp: number;

  /**
   * Database query time (if applicable)
   */
  queryTime?: string;

  /**
   * Number of database queries executed
   */
  queryCount?: number;

  /**
   * Memory usage information
   */
  memory?: {
    used: number;
    peak: number;
  };

  /**
   * Cache hit/miss information
   */
  cache?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

/**
 * Request Information Interface
 * Details about the original request (development only)
 */
export interface RequestInfo {
  /**
   * Query parameters
   */
  query: Record<string, any>;

  /**
   * Route parameters
   */
  params: Record<string, any>;

  /**
   * Client IP address
   */
  ip: string;

  /**
   * User agent string
   */
  userAgent: string;

  /**
   * Request headers (sanitized)
   */
  headers?: Record<string, any>;
}

/**
 * Error Details Interface
 * Detailed information about an error
 */
export interface ErrorDetails {
  /**
   * Type of error
   */
  type?: string;

  /**
   * Error source information
   */
  source?: {
    method?: string;
    field?: string;
    parameter?: string;
  };

  /**
   * Additional context about the error
   */
  context?: Record<string, any>;

  /**
   * Possible solutions for the error
   */
  suggestions?: string[];

  /**
   * Error severity level
   */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Validation Error Interface
 * Information about validation failures
 */
export interface ValidationError {
  /**
   * Field that failed validation
   */
  field: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Value that failed validation
   */
  value?: any;

  /**
   * Array of validation constraint messages
   */
  constraints?: string[];

  /**
   * Nested validation errors
   */
  children?: ValidationError[];
}

/**
 * Pagination Metadata Interface
 * Information about paginated results
 */
export interface PaginationMetadata {
  /**
   * Current page number
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items
   */
  total: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there's a next page
   */
  hasNextPage: boolean;

  /**
   * Whether there's a previous page
   */
  hasPreviousPage: boolean;

  /**
   * URL for the next page (if available)
   */
  nextPage?: string;

  /**
   * URL for the previous page (if available)
   */
  previousPage?: string;

  /**
   * URL for the first page
   */
  firstPage?: string;

  /**
   * URL for the last page
   */
  lastPage?: string;
}

/**
 * Health Check Response Interface
 * Response format for health check endpoints
 */
export interface HealthCheckResponse {
  /**
   * Overall health status
   */
  status: 'healthy' | 'unhealthy' | 'degraded';

  /**
   * Timestamp of the health check
   */
  timestamp: string;

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
   * Health check summary
   */
  summary?: HealthSummary;
}

/**
 * Health Indicator Result Interface
 * Result of an individual health check
 */
export interface HealthIndicatorResult {
  /**
   * Status of this health check
   */
  status: 'pass' | 'fail' | 'warn';

  /**
   * Human-readable message
   */
  message?: string;

  /**
   * Duration of the health check in milliseconds
   */
  duration?: number;

  /**
   * Additional data from the health check
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
}

/**
 * Health Summary Interface
 * Summary of health check results
 */
export interface HealthSummary {
  /**
   * Total number of health checks
   */
  total: number;

  /**
   * Number of healthy checks
   */
  healthy: number;

  /**
   * Number of unhealthy checks
   */
  unhealthy: number;

  /**
   * Number of degraded checks
   */
  degraded: number;

  /**
   * Number of disabled checks
   */
  disabled: number;
}

/**
 * API Documentation Response Interface
 * Response format for API documentation endpoints
 */
export interface DocumentationResponse {
  /**
   * API title
   */
  title: string;

  /**
   * API version
   */
  version: string;

  /**
   * API description
   */
  description: string;

  /**
   * Base URL of the API
   */
  baseUrl: string;

  /**
   * List of available endpoints
   */
  endpoints: EndpointInfo[];

  /**
   * Authentication information
   */
  authentication?: AuthenticationInfo;

  /**
   * Contact information
   */
  contact?: ContactInfo;

  /**
   * License information
   */
  license?: LicenseInfo;
}

/**
 * Endpoint Information Interface
 * Information about an API endpoint
 */
export interface EndpointInfo {
  /**
   * HTTP method
   */
  method: string;

  /**
   * Endpoint path
   */
  path: string;

  /**
   * Endpoint summary
   */
  summary: string;

  /**
   * Endpoint description
   */
  description?: string;

  /**
   * Response status codes
   */
  responses: Record<number, string>;

  /**
   * Whether endpoint requires authentication
   */
  requiresAuth: boolean;

  /**
   * Required roles (if any)
   */
  roles?: string[];

  /**
   * Rate limiting information
   */
  rateLimit?: RateLimitInfo;
}

/**
 * Authentication Information Interface
 * Information about API authentication
 */
export interface AuthenticationInfo {
  /**
   * Authentication types supported
   */
  types: string[];

  /**
   * Authentication endpoint
   */
  endpoint?: string;

  /**
   * Token expiration time
   */
  tokenExpiration?: string;

  /**
   * Refresh token expiration time
   */
  refreshTokenExpiration?: string;
}

/**
 * Rate Limit Information Interface
 * Information about rate limiting for an endpoint
 */
export interface RateLimitInfo {
  /**
   * Maximum requests per window
   */
  requests: number;

  /**
   * Time window in milliseconds
   */
  window: number;

  /**
   * Rate limit type
   */
  type: 'fixed' | 'sliding';
}

/**
 * Contact Information Interface
 * API contact information
 */
export interface ContactInfo {
  /**
   * Contact name
   */
  name: string;

  /**
   * Contact URL
   */
  url?: string;

  /**
   * Contact email
   */
  email?: string;
}

/**
 * License Information Interface
 * API license information
 */
export interface LicenseInfo {
  /**
   * License name
   */
  name: string;

  /**
   * License URL
   */
  url?: string;
}