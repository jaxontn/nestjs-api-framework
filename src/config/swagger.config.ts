import { DocumentBuilder, SwaggerCustomOptions, SwaggerModuleOptions } from '@nestjs/swagger';

/**
 * Swagger Configuration
 *
 * Provides OpenAPI/Swagger documentation configuration for the API.
 * Includes authentication, security schemes, and custom styling.
 */

/**
 * Creates and returns Swagger document builder with base configuration
 *
 * @returns Configured DocumentBuilder instance
 */
export const createSwaggerDocumentBuilder = (): DocumentBuilder => {
  return new DocumentBuilder()
    .setTitle('NestJS API Framework')
    .setDescription('A comprehensive, production-ready NestJS API framework with authentication, authorization, and best practices built-in.')
    .setVersion('1.0.0')
    .setContact(
      'API Support',
      'https://example.com/support',
      'support@example.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(
      process.env.API_BASE_URL || 'http://localhost:3001',
      'Development Server'
    )
    .addServer(
      process.env.API_PROD_URL || 'https://api.example.com',
      'Production Server'
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'Enter API key for authentication',
      },
      'API-key'
    )
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management')
    .addSecurity('JWT-auth', [])
    .addSecurity('API-key', []);
};

/**
 * Custom Swagger options for enhanced UI and functionality
 */
export const swaggerCustomOptions: SwaggerCustomOptions = {
  // Enable Swagger Explorer
  explorer: true,

  // Custom CSS for Swagger UI
  customCss: `
    .topbar { display: none; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { margin: 20px 0; }
    .swagger-ui .info .title { color: #3b82f6; }
  `,

  // Custom favicon
  customfavIcon: '/favicon.ico',

  // Custom site title
  customSiteTitle: 'NestJS API Framework Documentation',

  // Enable deep linking
  deepLinking: true,

  // Default models expansion depth
  defaultModelsExpandDepth: 2,

  // Default model expand depth
  defaultModelExpandDepth: 2,

  // Show request duration
  displayRequestDuration: true,

  // Enable filtering
  filter: true,

  // Show extensions
  showExtensions: true,

  // Show common extensions
  showCommonExtensions: true,

  // Try it out behavior
  tryItOutEnabled: process.env.NODE_ENV !== 'production',
};

/**
 * Complete Swagger module configuration
 */
export const swaggerConfig: SwaggerModuleOptions = {
  customCss: swaggerCustomOptions.customCss,
  customfavIcon: swaggerCustomOptions.customfavIcon,
  customSiteTitle: swaggerCustomOptions.customSiteTitle,
  explorer: swaggerCustomOptions.explorer,
  deepLinking: swaggerCustomOptions.deepLinking,
  displayRequestDuration: swaggerCustomOptions.displayRequestDuration,
  filter: swaggerCustomOptions.filter,
  showExtensions: swaggerCustomOptions.showExtensions,
  showCommonExtensions: swaggerCustomOptions.showCommonExtensions,
  tryItOutEnabled: swaggerCustomOptions.tryItOutEnabled,
};

/**
 * API Response Schemas for consistent documentation
 */
export const apiResponseSchemas = {
  success: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operation successful' },
      data: { type: 'object' },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/endpoint' },
    },
  },

  error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Error occurred' },
      error: { type: 'string', example: 'Error details' },
      statusCode: { type: 'number', example: 400 },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/endpoint' },
    },
  },

  unauthorized: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Unauthorized' },
      error: { type: 'string', example: 'Invalid or missing authentication token' },
      statusCode: { type: 'number', example: 401 },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/endpoint' },
    },
  },

  forbidden: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Forbidden' },
      error: { type: 'string', example: 'Insufficient permissions' },
      statusCode: { type: 'number', example: 403 },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/endpoint' },
    },
  },

  notFound: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Resource not found' },
      error: { type: 'string', example: 'The requested resource does not exist' },
      statusCode: { type: 'number', example: 404 },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/endpoint' },
    },
  },

  validationError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Validation failed' },
      error: { type: 'string', example: 'Invalid input data' },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'email' },
            message: { type: 'string', example: 'Email is required' },
          },
        },
      },
      statusCode: { type: 'number', example: 400 },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/v1/endpoint' },
    },
  },
};

/**
 * Pagination Schema for list endpoints
 */
export const paginationSchema = {
  type: 'object',
  properties: {
    page: {
      type: 'number',
      minimum: 1,
      default: 1,
      description: 'Page number for pagination'
    },
    limit: {
      type: 'number',
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Number of items per page'
    },
    sortBy: {
      type: 'string',
      description: 'Field to sort by'
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
      description: 'Sort order'
    },
  },
};

/**
 * Paginated Response Schema
 */
export const paginatedResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Data retrieved successfully' },
    data: {
      type: 'array',
      items: { type: 'object' },
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        total: { type: 'number', example: 100 },
        totalPages: { type: 'number', example: 10 },
        hasNextPage: { type: 'boolean', example: true },
        hasPreviousPage: { type: 'boolean', example: false },
      },
    },
    timestamp: { type: 'string', format: 'date-time' },
    path: { type: 'string', example: '/api/v1/endpoint' },
  },
};