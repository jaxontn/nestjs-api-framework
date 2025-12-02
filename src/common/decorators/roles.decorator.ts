import { SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Roles decorator key for metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Marks a route or controller with required roles for access.
 * Works in conjunction with RolesGuard to enforce role-based access control.
 *
 * Usage:
 * ```typescript
 * @Roles('admin', 'super_admin')
 * @Get('admin-route')
 * getAdminData() {
 *   // Only accessible by admin and super_admin roles
 * }
 * ```
 *
 * Can be applied to controllers or individual route handlers.
 *
 * @param roles Array of roles that are allowed to access the route
 * @returns Decorator function
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Admin roles decorator
 *
 * Shortcut decorator for routes that require admin access
 *
 * Usage:
 * ```typescript
 * @AdminOnly()
 * @Get('admin-only')
 * getAdminOnlyData() {
 *   // Only accessible by admin roles
 * }
 * ```
 *
 * @returns Decorator function
 */
export const AdminOnly = () => Roles('admin', 'super_admin');

/**
 * Super Admin roles decorator
 *
 * Shortcut decorator for routes that require super admin access
 *
 * Usage:
 * ```typescript
 * @SuperAdminOnly()
 * @Get('super-admin-only')
 * getSuperAdminOnlyData() {
 *   // Only accessible by super_admin role
 * }
 * ```
 *
 * @returns Decorator function
 */
export const SuperAdminOnly = () => Roles('super_admin');

/**
 * User roles decorator
 *
 * Shortcut decorator for routes that require user access (not guest)
 *
 * Usage:
 * ```typescript
 * @UserOnly()
 * @Get('user-dashboard')
 * getUserDashboard() {
 *   // Accessible by any authenticated user
 * }
 * ```
 *
 * @returns Decorator function
 */
export const UserOnly = () => Roles('user', 'admin', 'super_admin');

/**
 * Moderator roles decorator
 *
 * Shortcut decorator for routes that require moderator access or higher
 *
 * Usage:
 * ```typescript
 * @ModeratorOnly()
 * @Get('moderate-content')
 * getModerationTools() {
 *   // Accessible by moderator, admin, or super_admin
 * }
 * ```
 *
 * @returns Decorator function
 */
export const ModeratorOnly = () => Roles('moderator', 'admin', 'super_admin');

/**
 * Premium roles decorator
 *
 * Shortcut decorator for routes that require premium user access
 *
 * Usage:
 * ```typescript
 * @PremiumOnly()
 * @Get('premium-features')
 * getPremiumFeatures() {
 *   // Accessible by premium, admin, or super_admin roles
 * }
 * ```
 *
 * @returns Decorator function
 */
export const PremiumOnly = () => Roles('premium', 'admin', 'super_admin');

/**
 * Verified roles decorator
 *
 * Shortcut decorator for routes that require verified user access
 *
 * Usage:
 * ```typescript
 * @VerifiedOnly()
 * @Get('verified-features')
 * getVerifiedFeatures() {
 *   // Accessible by verified users and above
 * }
 * ```
 *
 * @returns Decorator function
 */
export const VerifiedOnly = () => Roles('verified', 'premium', 'admin', 'super_admin');

/**
 * Roles with API documentation decorator
 *
 * Combines roles with Swagger documentation for better API documentation
 *
 * Usage:
 * ```typescript
 * @RolesWithDocs('admin', {
 *   summary: 'Admin only endpoint',
 *   description: 'This endpoint requires admin role access',
 *   unauthorized: 'Admin access required'
 * })
 * @Get('admin-data')
 * getAdminData() {
 *   // Admin only endpoint with documented requirements
 * }
 * ```
 *
 * @param roles Array of required roles
 * @param swaggerConfig Swagger configuration options
 * @returns Decorator function
 */
export const RolesWithDocs = (
  roles: string[],
  swaggerConfig?: {
    summary?: string;
    description?: string;
    unauthorized?: string;
  }
) => {
  const decorators = [
    Roles(...roles),
    ApiBearerAuth(),
    ApiOperation({
      summary: swaggerConfig?.summary || 'Protected endpoint',
      description: swaggerConfig?.description || `Requires role(s): ${roles.join(', ')}`,
    }),
    ApiResponse({
      status: 403,
      description: swaggerConfig?.unauthorized || 'Insufficient permissions',
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
 * Role-based rate limiting decorator
 *
 * Applies different rate limits based on user roles
 *
 * Usage:
 * ```typescript
 * @RoleBasedRateLimit({
 *   admin: { requests: 1000, windowMs: 15 * 60 * 1000 },
 *   user: { requests: 100, windowMs: 15 * 60 * 1000 },
 *   guest: { requests: 10, windowMs: 15 * 60 * 1000 }
 * })
 * @Get('data')
 * getData() {
 *   // Rate limited based on user role
 * }
 * ```
 *
 * @param limits Rate limit configuration by role
 * @returns Decorator function
 */
export const RoleBasedRateLimit = (limits: Record<string, { requests: number; windowMs: number }>) => {
  const key = 'roleRateLimit';
  return SetMetadata(key, limits);
};

/**
 * Custom permission decorator
 *
 * Allows for complex permission checks beyond simple roles
 *
 * Usage:
 * ```typescript
 * @CustomPermission((user, request) => {
 *   return user.id === request.params.userId;
 * })
 * @Get('user/:userId')
 * getUserData(@Param('userId') userId: string) {
 *   // Only accessible if user is accessing their own data
 * }
 * ```
 *
 * @param permissionCheck Function that determines if access is granted
 * @returns Decorator function
 */
export const CustomPermission = (permissionCheck: (user: any, request?: any) => boolean) => {
  const key = 'customPermission';
  return SetMetadata(key, permissionCheck);
};

/**
 * Feature flag decorator
 *
 * Controls access based on feature flags
 *
 * Usage:
 * ```typescript
 * @FeatureFlag('new_feature')
 * @Get('beta-feature')
 * getBetaFeature() {
 *   // Only accessible if new_feature flag is enabled
 * }
 * ```
 *
 * @param flagName Name of the feature flag
 * @returns Decorator function
 */
export const FeatureFlag = (flagName: string) => {
  const key = 'featureFlag';
  return SetMetadata(key, flagName);
};

/**
 * Multi-tenant decorator
 *
 * Marks routes that require tenant context
 *
 * Usage:
 * ```typescript
 * @TenantRequired()
 * @Get('tenant-data')
 * getTenantData() {
 *   // Requires tenant context
 * }
 * ```
 *
 * @returns Decorator function
 */
export const TenantRequired = () => {
  const key = 'tenantRequired';
  return SetMetadata(key, true);
};

/**
 * API key authentication decorator
 *
 * Marks routes that require API key authentication instead of JWT
 *
 * Usage:
 * ```typescript
 * @ApiKeyRequired()
 * @Get('api-endpoint')
 * getApiEndpoint() {
 *   // Requires API key authentication
 * }
 * ```
 *
 * @returns Decorator function
 */
export const ApiKeyRequired = () => {
  const key = 'apiKeyRequired';
  return SetMetadata(key, true);
};

/**
 * Resource owner decorator
 *
 * Ensures users can only access their own resources
 *
 * Usage:
 * ```typescript
 * @ResourceOwner('userId')
 * @Get('users/:userId/data')
 * getUserData(@Param('userId') userId: string) {
 *   // Only accessible if user owns the resource
 * }
 * ```
 *
 * @param resourceParam Parameter name that identifies the resource owner
 * @returns Decorator function
 */
export const ResourceOwner = (resourceParam: string) => {
  const key = 'resourceOwner';
  return SetMetadata(key, resourceParam);
};

/**
 * Environment-specific role decorator
 *
 * Applies role requirements only in specific environments
 *
 * Usage:
 * ```typescript
 * @EnvironmentRoles(['admin'], ['production'])
 * @Get('debug-info')
 * getDebugInfo() {
 *   // Requires admin role only in production
 * }
 * ```
 *
 * @param roles Array of required roles
 * @param environments Array of environments where the roles apply
 * @returns Decorator function
 */
export const EnvironmentRoles = (roles: string[], environments: string[]) => {
  const key = 'environmentRoles';
  return SetMetadata(key, { roles, environments });
};

/**
 * Conditional role decorator
 *
 * Applies role requirements based on a condition
 *
 * Usage:
 * ```typescript
 * @ConditionalRoles(
 *   (request) => request.query.strict === 'true',
 *   ['admin']
 * )
 * @Get('data')
 * getData(@Query() query: any) {
 *   // Requires admin role if strict=true query param
 * }
 * ```
 *
 * @param condition Function that determines if roles should be applied
 * @param roles Array of roles to apply if condition is met
 * @returns Decorator function
 */
export const ConditionalRoles = (
  condition: (request: any) => boolean,
  roles: string[]
) => {
  const key = 'conditionalRoles';
  return SetMetadata(key, { condition, roles });
};

/**
 * Time-based role decorator
 *
 * Applies role requirements within specific time windows
 *
 * Usage:
 * ```typescript
 * @TimeBasedRoles(
 *   ['admin'],
 *   { start: '09:00', end: '17:00', timezone: 'America/New_York' }
 * )
 * @Get('business-hours-data')
 * getBusinessHoursData() {
 *   // Requires admin role only during business hours
 * }
 * ```
 *
 * @param roles Array of required roles
 * @param timeWindow Time window configuration
 * @returns Decorator function
 */
export const TimeBasedRoles = (
  roles: string[],
  timeWindow: { start: string; end: string; timezone?: string }
) => {
  const key = 'timeBasedRoles';
  return SetMetadata(key, { roles, timeWindow });
};