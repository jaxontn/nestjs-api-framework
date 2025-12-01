import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsUUID, IsDateString, Min, Max, IsObject, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, Permission } from '../entities/merchant-user.entity';
import { RoleType, SystemRole } from '../entities/user-role.entity';
import { ActivityCategory, ActivityAction } from '../entities/user-activity.entity';

// Base DTO for common fields
export class BaseMerchantUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

// Create Merchant User DTO
export class CreateMerchantUserDto extends BaseMerchantUserDto {
  @ApiProperty({ description: 'Merchant ID' })
  @IsUUID()
  merchant_id: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Initial password (if not sending invitation)' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Send invitation email instead of requiring password' })
  @IsOptional()
  @IsBoolean()
  send_invitation?: boolean;

  @ApiPropertyOptional({ description: 'User roles to assign' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

// Update Merchant User DTO
export class UpdateMerchantUserDto extends BaseMerchantUserDto {
  @ApiPropertyOptional({ description: 'New email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'New password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Two-factor authentication enabled' })
  @IsOptional()
  @IsBoolean()
  two_factor_enabled?: boolean;
}

// User Management DTOs
export class InviteUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User first name' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ description: 'Roles to assign to user' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ description: 'Custom message for invitation email' })
  @IsOptional()
  @IsString()
  custom_message?: string;

  @ApiPropertyOptional({ description: 'Invitation expiration in hours (default: 48)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168) // 1 week max
  invitation_expires_hours?: number;
}

// Role Management DTOs
export class CreateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Role type' })
  @IsOptional()
  @IsEnum(RoleType)
  type?: RoleType;

  @ApiProperty({ description: 'List of permissions for this role' })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'List of permissions for this role' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Whether role is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID to assign role to' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ description: 'Role ID to assign (if not creating new role)' })
  @IsOptional()
  @IsUUID()
  role_id?: string;

  @ApiPropertyOptional({ description: 'Create new role with these details' })
  @IsOptional()
  new_role?: CreateRoleDto;
}

export class RemoveRoleDto {
  @ApiProperty({ description: 'User ID to remove role from' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Role ID to remove' })
  @IsUUID()
  role_id: string;
}

// Activity and Audit DTOs
export class GetActivityDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @ApiPropertyOptional({ description: 'Filter by action' })
  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @ApiPropertyOptional({ description: 'Filter by resource type' })
  @IsOptional()
  @IsString()
  resource_type?: string;

  @ApiPropertyOptional({ description: 'Filter by resource ID' })
  @IsOptional()
  @IsUUID()
  resource_id?: string;

  @ApiPropertyOptional({ description: 'Filter by success status' })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Number of results to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of results to skip' })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class GetAuditLogDto extends GetActivityDto {
  @ApiPropertyOptional({ description: 'Include only security-related activities' })
  @IsOptional()
  @IsBoolean()
  security_only?: boolean;

  @ApiPropertyOptional({ description: 'Include only failed activities' })
  @IsOptional()
  @IsBoolean()
  failures_only?: boolean;

  @ApiPropertyOptional({ description: 'Include activities performed on behalf of others' })
  @IsOptional()
  @IsBoolean()
  include_delegated?: boolean;
}

// Permission Check DTO
export class CheckPermissionDto {
  @ApiProperty({ description: 'User ID to check permissions for' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Permission to check' })
  @IsEnum(Permission)
  permission: Permission;

  @ApiPropertyOptional({ description: 'Resource type being accessed' })
  @IsOptional()
  @IsString()
  resource_type?: string;

  @ApiPropertyOptional({ description: 'Resource ID being accessed' })
  @IsOptional()
  @IsUUID()
  resource_id?: string;
}

// Bulk Operations DTO
export class BulkUserOperationDto {
  @ApiProperty({ description: 'List of user IDs to operate on' })
  @IsArray()
  @IsUUID(4, { each: true })
  user_ids: string[];

  @ApiProperty({ description: 'Operation to perform' })
  @IsEnum(['activate', 'deactivate', 'delete', 'send_invitation'])
  operation: string;

  @ApiPropertyOptional({ description: 'Reason for the operation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkRoleAssignmentDto {
  @ApiProperty({ description: 'List of user IDs to assign roles to' })
  @IsArray()
  @IsUUID(4, { each: true })
  user_ids: string[];

  @ApiProperty({ description: 'Role ID to assign' })
  @IsUUID()
  role_id: string;

  @ApiPropertyOptional({ description: 'Whether to replace existing roles' })
  @IsOptional()
  @IsBoolean()
  replace_existing?: boolean;
}

// User Statistics DTO
export class GetUserStatsDto {
  @ApiPropertyOptional({ description: 'Start date for statistics period' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for statistics period' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Group statistics by period' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  group_by?: 'day' | 'week' | 'month';
}

// System Role Templates DTO
export class GetSystemRolesDto {
  @ApiPropertyOptional({ description: 'Filter by role type' })
  @IsOptional()
  @IsEnum(RoleType)
  type?: RoleType;

  @ApiPropertyOptional({ description: 'Include only roles with specific permissions' })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  has_permissions?: Permission[];
}

// Import/Export DTOs
export class ImportUsersDto {
  @ApiProperty({ description: 'List of users to import' })
  @IsArray()
  @IsObject({ each: true })
  users: CreateMerchantUserDto[];

  @ApiPropertyOptional({ description: 'Send invitations to imported users' })
  @IsOptional()
  @IsBoolean()
  send_invitations?: boolean;

  @ApiPropertyOptional({ description: 'Role to assign to all imported users' })
  @IsOptional()
  @IsString()
  default_role?: string;

  @ApiPropertyOptional({ description: 'Skip users with duplicate emails' })
  @IsOptional()
  @IsBoolean()
  skip_duplicates?: boolean;
}

export class ExportUsersDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filter by role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Export format' })
  @IsOptional()
  @IsEnum(['csv', 'xlsx', 'json'])
  format?: 'csv' | 'xlsx' | 'json';

  @ApiPropertyOptional({ description: 'Include user activities in export' })
  @IsOptional()
  @IsBoolean()
  include_activities?: boolean;

  @ApiPropertyOptional({ description: 'Include user roles in export' })
  @IsOptional()
  @IsBoolean()
  include_roles?: boolean;
}

// Response DTOs
export class MerchantUserResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: any;

  @ApiProperty()
  timestamp: string;
}

export class UserListResponseDto extends MerchantUserResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  limit?: number;
}

export class ActivityLogResponseDto extends MerchantUserResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  total_activities?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  failed_activities?: number;
}