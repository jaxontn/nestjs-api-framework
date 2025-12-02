import { SetMetadata } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Public route decorator key for metadata
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Marks a route or controller as public (no authentication required).
 * Works in conjunction with JwtAuthGuard to bypass authentication for public routes.
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Get('health')
 * getHealth() {
 *   // Accessible without authentication
 * }
 * ```
 *
 * Can be applied to controllers or individual route handlers.
 *
 * @returns Decorator function that marks route as public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Public with rate limiting decorator
 *
 * Marks a route as public but applies rate limiting for abuse prevention
 *
 * Usage:
 * ```typescript
 * @PublicWithRateLimit({ requests: 10, windowMs: 60000 })
 * @Post('contact')
 * submitContactForm() {
 *   // Public endpoint with rate limiting
 * }
 * ```
 *
 * @param options Rate limiting options
 * @returns Decorator function
 */
export const PublicWithRateLimit = (options: { requests: number; windowMs: number }) => {
  const key = 'publicRateLimit';
  return SetMetadata(key, options);
};

/**
 * Public with API documentation decorator
 *
 * Combines public access with Swagger documentation
 *
 * Usage:
 * ```typescript
 * @PublicWithDocs({
 *   summary: 'Public endpoint',
 *   description: 'This endpoint is accessible without authentication',
 *   tags: ['Public']
 * })
 * @Get('info')
 * getPublicInfo() {
 *   // Public endpoint with documentation
 * }
 * ```
 *
 * @param swaggerConfig Swagger configuration options
 * @returns Decorator function
 */
export const PublicWithDocs = (swaggerConfig?: {
  summary?: string;
  description?: string;
  tags?: string[];
}) => {
  const decorators = [
    Public(),
    ApiOperation({
      summary: swaggerConfig?.summary || 'Public endpoint',
      description: swaggerConfig?.description || 'Accessible without authentication',
      tags: swaggerConfig?.tags || ['Public'],
    }),
    ApiResponse({
      status: 200,
      description: 'Request successful',
    }),
  ];

  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    decorators.forEach((decorator) => {
      if (propertyKey) {
        decorator(target, propertyKey, descriptor);
      } else {
        decorator(target);
      }
    });
  };
};

/**
 * Health check decorator
 *
 * Shortcut decorator for health check endpoints
 *
 * Usage:
 * ```typescript
 * @HealthCheck()
 * @Get('health')
 * getHealth() {
 *   // Health check endpoint
 * }
 * ```
 *
 * @returns Decorator function
 */
export const HealthCheck = () => PublicWithDocs({
  summary: 'Health check endpoint',
  description: 'Application health status',
  tags: ['Health'],
});

/**
 * Metrics decorator
 *
 * Shortcut decorator for metrics endpoints
 *
 * Usage:
 * ```typescript
 * @Metrics()
 * @Get('metrics')
 * getMetrics() {
 *   // Metrics endpoint
 * }
 * ```
 *
 * @returns Decorator function
 */
export const Metrics = () => PublicWithDocs({
  summary: 'Application metrics',
  description: 'Performance and usage metrics',
  tags: ['Metrics'],
});

/**
 * Documentation decorator
 *
 * Shortcut decorator for API documentation endpoints
 *
 * Usage:
 * ```typescript
 * @ApiDocumentation()
 * @Get('docs')
 * getApiDocs() {
 *   // API documentation endpoint
 * }
 * ```
 *
 * @returns Decorator function
 */
export const ApiDocumentation = () => PublicWithDocs({
  summary: 'API documentation',
  description: 'API documentation and information',
  tags: ['Documentation'],
});

/**
 * Status page decorator
 *
 * Shortcut decorator for status page endpoints
 *
 * Usage:
 * ```typescript
 * @StatusPage()
 * @Get('status')
 * getStatus() {
 *   // Status page endpoint
 * }
 * ```
 *
 * @returns Decorator function
 */
export const StatusPage = () => PublicWithDocs({
  summary: 'Service status',
  description: 'Current service status and information',
  tags: ['Status'],
});

/**
 * Landing page decorator
 *
 * Shortcut decorator for landing page endpoints
 *
 * Usage:
 * ```typescript
 * @LandingPage()
 * @Get('')
 * getLandingPage() {
 *   // Landing page endpoint
 * }
 * ```
 *
 * @returns Decorator function
 */
export const LandingPage = () => PublicWithDocs({
  summary: 'API landing page',
  description: 'API information and welcome message',
  tags: ['General'],
});

/**
 * Public with caching decorator
 *
 * Marks a route as public and enables response caching
 *
 * Usage:
 * ```typescript
 * @PublicWithCache(300) // 5 minutes cache
 * @Get('public-data')
 * getPublicData() {
 *   // Public endpoint with caching
 * }
 * ```
 *
 * @param ttl Cache time-to-live in seconds
 * @returns Decorator function
 */
export const PublicWithCache = (ttl: number = 300) => {
  const key = 'publicCache';
  return SetMetadata(key, { ttl });
};

/**
 * Public with logging decorator
 *
 * Marks a route as public but enables access logging
 *
 * Usage:
 * ```typescript
 * @PublicWithLogging('api_access')
 * @Post('webhook')
 * handleWebhook() {
 *   // Public endpoint with access logging
 * }
 * ```
 *
 * @param logCategory Category for access logging
 * @returns Decorator function
 */
export const PublicWithLogging = (logCategory: string = 'public_access') => {
  const key = 'publicLogging';
  return SetMetadata(key, { logCategory });
};

/**
 * Public with validation decorator
 *
 * Marks a route as public but applies input validation
 *
 * Usage:
 * ```typescript
 * @PublicWithValidation()
 * @Post('contact')
 * submitContactForm() {
 *   // Public endpoint with input validation
 * }
 * ```
 *
 * @returns Decorator function
 */
export const PublicWithValidation = () => {
  const key = 'publicValidation';
  return SetMetadata(key, true);
};

/**
 * Public with CORS decorator
 *
 * Marks a route as public with specific CORS settings
 *
 * Usage:
 * ```typescript
 * @PublicWithCors({
 *   origin: ['https://example.com'],
 *   methods: ['GET', 'POST'],
 *   allowedHeaders: ['Content-Type']
 * })
 * @Post('webhook')
 * handleWebhook() {
 *   // Public endpoint with custom CORS
 * }
 * ```
 *
 * @param corsOptions CORS configuration options
 * @returns Decorator function
 */
export const PublicWithCors = (corsOptions: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}) => {
  const key = 'publicCors';
  return SetMetadata(key, corsOptions);
};

/**
 * Public with webhook decorator
 *
 * Marks a route as a public webhook endpoint
 *
 * Usage:
 * ```typescript
 * @PublicWebhook()
 * @Post('webhook')
 * handleWebhook() {
 *   // Public webhook endpoint
 * }
 * ```
 *
 * @returns Decorator function
 */
export const PublicWebhook = () => {
  const key = 'publicWebhook';
  return SetMetadata(key, true);
};

/**
 * Public with monitoring decorator
 *
 * Marks a route as public and enables monitoring
 *
 * Usage:
 * ```typescript
 * @PublicWithMonitoring()
 * @Get('status')
 * getStatus() {
 *   // Public endpoint with monitoring
 * }
 * ```
 *
 * @returns Decorator function
 */
export const PublicWithMonitoring = () => {
  const key = 'publicMonitoring';
  return SetMetadata(key, true);
};

/**
 * Public with analytics decorator
 *
 * Marks a route as public and tracks analytics
 *
 * Usage:
 * ```typescript
 * @PublicWithAnalytics('public_api_calls')
 * @Get('public-data')
 * getPublicData() {
 *   // Public endpoint with analytics tracking
 * }
 * ```
 *
 * @param eventCategory Analytics event category
 * @returns Decorator function
 */
export const PublicWithAnalytics = (eventCategory: string = 'public_access') => {
  const key = 'publicAnalytics';
  return SetMetadata(key, { eventCategory });
};

/**
 * Public with A/B testing decorator
 *
 * Marks a route as public with A/B testing support
 *
 * Usage:
 * ```typescript
 * @PublicWithABTest('new_ui')
 * @Get('page')
 * getPage() {
 *   // Public endpoint with A/B testing
 * }
 * ```
 *
 * @param testName A/B test name
 * @returns Decorator function
 */
export const PublicWithABTest = (testName: string) => {
  const key = 'publicABTest';
  return SetMetadata(key, { testName });
};

/**
 * Public with geographic restrictions decorator
 *
 * Marks a route as public but restricts access based on geography
 *
 * Usage:
 * ```typescript
 * @PublicWithGeoRestriction(['US', 'CA'])
 * @Get('us-only')
 * getUSOnlyData() {
 *   // Public endpoint restricted to US and Canada
 * }
 * ```
 *
 * @param allowedCountries Array of allowed country codes
 * @returns Decorator function
 */
export const PublicWithGeoRestriction = (allowedCountries: string[]) => {
  const key = 'publicGeoRestriction';
  return SetMetadata(key, { allowedCountries });
};

/**
 * Public with time window decorator
 *
 * Marks a route as public but restricts access to specific time windows
 *
 * Usage:
 * ```typescript
 * @PublicWithTimeWindow('09:00', '17:00', 'America/New_York')
 * @Get('business-hours')
 * getBusinessHoursData() {
 *   // Public endpoint accessible only during business hours
 * }
 * ```
 *
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @param timezone Timezone identifier
 * @returns Decorator function
 */
export const PublicWithTimeWindow = (
  startTime: string,
  endTime: string,
  timezone: string = 'UTC'
) => {
  const key = 'publicTimeWindow';
  return SetMetadata(key, { startTime, endTime, timezone });
};

/**
 * Public with IP whitelist decorator
 *
 * Marks a route as public but restricts access to specific IP addresses
 *
 * Usage:
 * ```typescript
 * @PublicWithIPWhitelist(['192.168.1.1', '10.0.0.1'])
 * @Get('internal')
 * getInternalData() {
 *   // Public endpoint accessible only from whitelisted IPs
 * }
 * ```
 *
 * @param allowedIPs Array of allowed IP addresses
 * @returns Decorator function
 */
export const PublicWithIPWhitelist = (allowedIPs: string[]) => {
  const key = 'publicIPWhitelist';
  return SetMetadata(key, { allowedIPs });
};