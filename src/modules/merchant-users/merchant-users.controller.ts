import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantUsersService } from './merchant-users.service';
import {
  CreateMerchantUserDto,
  UpdateMerchantUserDto,
  InviteUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleDto,
  RemoveRoleDto,
  GetActivityDto,
  GetAuditLogDto,
  CheckPermissionDto,
  BulkUserOperationDto,
  BulkRoleAssignmentDto,
  GetUserStatsDto,
  GetSystemRolesDto,
  ImportUsersDto,
  ExportUsersDto,
  MerchantUserResponseDto,
  UserListResponseDto,
  ActivityLogResponseDto
} from './dto/merchant-users.dto';

@ApiTags('Merchant Users')
@ApiBearerAuth()
@Controller('merchant-users')
export class MerchantUsersController {
  constructor(private readonly merchantUsersService: MerchantUsersService) {}

  // User Management Endpoints
  @Post()
  @ApiOperation({ summary: 'Create new merchant user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async createUser(@Body() createUserData: CreateMerchantUserDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.createUser(createUserData);
    return {
      success: true,
      message: 'User created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users for merchant' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by user status' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: UserListResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getUsers(
    @Query('merchant_id') merchantId: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<UserListResponseDto> {
    const result = await this.merchantUsersService.getUsers(merchantId, { status, role, search, limit, offset });
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: result.users,
      total: result.total,
      page: Math.floor((offset || 0) / (limit || 10)) + 1,
      limit: limit || 10,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') userId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.getUser(userId);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateUser(
    @Param('id') userId: string,
    @Body() updateData: UpdateMerchantUserDto,
  ): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.updateUser(userId, updateData);
    return {
      success: true,
      message: 'User updated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') userId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.deleteUser(userId);
    return {
      success: true,
      message: 'User deleted successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Invitation System
  @Post('invite')
  @ApiOperation({ summary: 'Invite user to join merchant' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async inviteUser(@Body() inviteData: InviteUserDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.inviteUser(inviteData);
    return {
      success: true,
      message: 'Invitation sent successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/resend-invitation')
  @ApiOperation({ summary: 'Resend invitation email' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Invitation resent successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'No pending invitation' })
  async resendInvitation(@Param('id') userId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.resendInvitation(userId);
    return {
      success: true,
      message: 'Invitation resent successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Role Management
  @Get('roles')
  @ApiOperation({ summary: 'Get available roles for merchant' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiQuery({ name: 'include_system', required: false, description: 'Include system role templates' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getRoles(
    @Query('merchant_id') merchantId: string,
    @Query('include_system') includeSystem?: boolean,
  ): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.getRoles(merchantId, includeSystem);
    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('roles/system')
  @ApiOperation({ summary: 'Get system role templates' })
  @ApiResponse({ status: 200, description: 'System roles retrieved successfully', type: MerchantUserResponseDto })
  async getSystemRoles(@Query() query: GetSystemRolesDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.getSystemRoles(query);
    return {
      success: true,
      message: 'System roles retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createRole(@Body() createRoleData: CreateRoleDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.createRole(createRoleData);
    return {
      success: true,
      message: 'Role created successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('roles/:roleId')
  @ApiOperation({ summary: 'Update role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() updateData: UpdateRoleDto,
  ): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.updateRole(roleId, updateData);
    return {
      success: true,
      message: 'Role updated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('roles/:roleId')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('roleId') roleId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.deleteRole(roleId);
    return {
      success: true,
      message: 'Role deleted successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Roles assigned successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async assignRoles(
    @Param('id') userId: string,
    @Body() assignData: AssignRoleDto,
  ): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.assignRoles(userId, assignData);
    return {
      success: true,
      message: 'Roles assigned successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role removed successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  async removeRole(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
  ): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.removeRole(userId, roleId);
    return {
      success: true,
      message: 'Role removed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Permission Management
  @Post('check-permission')
  @ApiOperation({ summary: 'Check if user has specific permission' })
  @ApiResponse({ status: 200, description: 'Permission check completed', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async checkPermission(@Body() checkData: CheckPermissionDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.checkPermission(checkData);
    return {
      success: true,
      message: 'Permission check completed',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Activity Tracking
  @Get(':id/activity')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully', type: ActivityLogResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivity(
    @Param('id') userId: string,
    @Query() query: GetActivityDto,
  ): Promise<ActivityLogResponseDto> {
    const result = await this.merchantUsersService.getUserActivity(userId, query);
    return {
      success: true,
      message: 'User activity retrieved successfully',
      data: result.activities,
      total_activities: result.total,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('activity/audit')
  @ApiOperation({ summary: 'Get full audit log for merchant' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully', type: ActivityLogResponseDto })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getAuditLog(
    @Query('merchant_id') merchantId: string,
    @Query() query: GetAuditLogDto,
  ): Promise<ActivityLogResponseDto> {
    const result = await this.merchantUsersService.getAuditLog(merchantId, query);
    return {
      success: true,
      message: 'Audit log retrieved successfully',
      data: result.activities,
      total_activities: result.total,
      failed_activities: result.failed,
      timestamp: new Date().toISOString(),
    };
  }

  // User Statistics
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics overview' })
  @ApiQuery({ name: 'merchant_id', required: true, description: 'Merchant ID' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getUserStats(
    @Query('merchant_id') merchantId: string,
    @Query() query: GetUserStatsDto,
  ): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.getUserStats(merchantId, query);
    return {
      success: true,
      message: 'User statistics retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Bulk Operations
  @Post('bulk/operation')
  @ApiOperation({ summary: 'Perform bulk operation on users' })
  @ApiResponse({ status: 200, description: 'Bulk operation completed', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkOperation(@Body() bulkData: BulkUserOperationDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.bulkOperation(bulkData);
    return {
      success: true,
      message: 'Bulk operation completed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('bulk/assign-roles')
  @ApiOperation({ summary: 'Assign roles to multiple users' })
  @ApiResponse({ status: 200, description: 'Bulk role assignment completed', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkAssignRoles(@Body() bulkData: BulkRoleAssignmentDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.bulkAssignRoles(bulkData);
    return {
      success: true,
      message: 'Bulk role assignment completed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // Import/Export
  @Post('import')
  @ApiOperation({ summary: 'Import users from data' })
  @ApiResponse({ status: 201, description: 'Users imported successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async importUsers(@Body() importData: ImportUsersDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.importUsers(importData);
    return {
      success: true,
      message: 'Users imported successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export users data' })
  @ApiResponse({ status: 200, description: 'Users exported successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async exportUsers(@Body() exportData: ExportUsersDto): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.exportUsers(exportData);
    return {
      success: true,
      message: 'Users exported successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  // User Status Management
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activated successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activateUser(@Param('id') userId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.activateUser(userId);
    return {
      success: true,
      message: 'User activated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateUser(@Param('id') userId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.deactivateUser(userId);
    return {
      success: true,
      message: 'User deactivated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Initiate password reset for user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password reset initiated', type: MerchantUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserPassword(@Param('id') userId: string): Promise<MerchantUserResponseDto> {
    const result = await this.merchantUsersService.resetUserPassword(userId);
    return {
      success: true,
      message: 'Password reset initiated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
