import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Like, In, SelectQueryBuilder } from 'typeorm';
import { MerchantUser, UserStatus, Permission } from './entities/merchant-user.entity';
import { UserRole, RoleType, SystemRole } from './entities/user-role.entity';
import { UserActivity, ActivityCategory, ActivityAction } from './entities/user-activity.entity';
import { Merchant } from '../../entities/merchant.entity';
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
  ExportUsersDto
} from './dto/merchant-users.dto';

@Injectable()
export class MerchantUsersService {
  private readonly logger = new Logger(MerchantUsersService.name);

  constructor(
    @InjectRepository(MerchantUser)
    private readonly merchantUserRepository: Repository<MerchantUser>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly dataSource: DataSource,
  ) {}

  // User Management Methods
  async createUser(createUserData: CreateMerchantUserDto): Promise<MerchantUser> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify merchant exists
      const merchant = await this.merchantRepository.findOne({
        where: { id: createUserData.merchant_id }
      });

      if (!merchant) {
        throw new NotFoundException('Merchant not found');
      }

      // Check if user already exists
      const existingUser = await this.merchantUserRepository.findOne({
        where: { email: createUserData.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Create new user
      const user = this.merchantUserRepository.create({
        ...createUserData,
        status: createUserData.send_invitation ? UserStatus.PENDING : UserStatus.ACTIVE,
        emailVerified: false,
      });

      if (createUserData.send_invitation) {
        // Generate invitation token
        user.invitationToken = this.generateInvitationToken();
        user.invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
      }

      const savedUser = await queryRunner.manager.save(user);

      // Assign roles if provided
      if (createUserData.roles && createUserData.roles.length > 0) {
        for (const roleName of createUserData.roles) {
          const role = this.userRoleRepository.create({
            merchantId: createUserData.merchant_id,
            userId: savedUser.id,
            name: roleName,
            type: RoleType.CUSTOM,
            isSystemRole: false,
          });
          await queryRunner.manager.save(role);
        }
      } else {
        // Assign default role
        const defaultRole = UserRole.createViewerRole(createUserData.merchant_id, savedUser.id);
        await queryRunner.manager.save(defaultRole);
      }

      // Log activity
      await this.logActivity(
        savedUser.id,
        createUserData.merchant_id,
        ActivityCategory.USER_MANAGEMENT,
        ActivityAction.USER_ADDED,
        'user',
        savedUser.id,
        `${savedUser.first_name} ${savedUser.last_name}`
      );

      await queryRunner.commitTransaction();

      // Send invitation email if needed
      if (createUserData.send_invitation) {
        await this.sendInvitationEmail(savedUser);
      }

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUsers(merchantId: string, options: {
    status?: string;
    role?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ users: MerchantUser[], total: number }> {
    const { status, role, search, limit = 10, offset = 0 } = options;

    const query: SelectQueryBuilder<MerchantUser> = this.merchantUserRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'roles')
      .where('user.merchantId = :merchantId', { merchantId });

    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role) {
      query.andWhere('EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = user.id AND ur.name = :role)', { role });
    }

    const [users, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { users, total };
  }

  async getUser(userId: string): Promise<MerchantUser> {
    const user = await this.merchantUserRepository.findOne({
      where: { id: userId },
      relations: ['userRoles', 'merchant']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, updateData: UpdateMerchantUserDto): Promise<MerchantUser> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.getUser(userId);

      const oldData = { ...user };

      // Update user data
      Object.assign(user, updateData);

      const updatedUser = await queryRunner.manager.save(user);

      // Log changes
      await this.logActivity(
        userId,
        user.merchantId,
        ActivityCategory.USER_MANAGEMENT,
        ActivityAction.USER_UPDATED,
        'user',
        user.id,
        `${user.first_name} ${user.last_name}`,
        { old: oldData, new: updateData }
      );

      await queryRunner.commitTransaction();

      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.getUser(userId);

      // Soft delete by marking as inactive
      user.status = UserStatus.INACTIVE;
      await queryRunner.manager.save(user);

      // Log activity
      await this.logActivity(
        userId,
        user.merchantId,
        ActivityCategory.USER_MANAGEMENT,
        ActivityAction.USER_DELETED,
        'user',
        user.id,
        `${user.first_name} ${user.last_name}`
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Invitation System
  async inviteUser(inviteData: InviteUserDto): Promise<MerchantUser> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.merchantUserRepository.findOne({
        where: { email: inviteData.email },
        relations: ['merchant']
      });

      if (existingUser && existingUser.status !== UserStatus.INACTIVE) {
        throw new ConflictException('User with this email already exists');
      }

      // Create or update user
      let user: MerchantUser;
      if (existingUser) {
        // Reactivate inactive user
        existingUser.status = UserStatus.PENDING;
        existingUser.first_name = inviteData.first_name;
        existingUser.last_name = inviteData.last_name;
        existingUser.phone_number = inviteData.phone_number || existingUser.phone_number;
        user = existingUser;
      } else {
        // For invitation, we'll need to get merchant_id from somewhere
        // This is a placeholder - in real implementation, you'd get this from context or another field
        throw new BadRequestException('Merchant ID is required for invitations');
      }

      user.invitationToken = this.generateInvitationToken();
      user.invitationExpiresAt = new Date(Date.now() + (inviteData.invitation_expires_hours || 48) * 60 * 60 * 1000);

      const savedUser = await queryRunner.manager.save(user);

      // Assign roles if provided
      if (inviteData.roles && inviteData.roles.length > 0) {
        // Clear existing roles
        await queryRunner.manager.delete(UserRole, { userId: savedUser.id });

        // Assign new roles
        for (const roleName of inviteData.roles) {
          const role = this.userRoleRepository.create({
            merchantId: user.merchantId,
            userId: savedUser.id,
            name: roleName,
            type: RoleType.CUSTOM,
            isSystemRole: false,
          });
          await queryRunner.manager.save(role);
        }
      }

      // Log activity
      await this.logActivity(
        savedUser.id,
        user.merchantId,
        ActivityCategory.USER_MANAGEMENT,
        ActivityAction.USER_INVITED,
        'user',
        savedUser.id,
        `${savedUser.first_name} ${savedUser.last_name}`
      );

      await queryRunner.commitTransaction();

      // Send invitation email
      await this.sendInvitationEmail(savedUser, inviteData.custom_message);

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async resendInvitation(userId: string): Promise<MerchantUser> {
    const user = await this.getUser(userId);

    if (user.status !== UserStatus.PENDING || !user.invitationToken) {
      throw new BadRequestException('No pending invitation found');
    }

    // Generate new invitation token and extend expiration
    user.invitationToken = this.generateInvitationToken();
    user.invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const updatedUser = await this.merchantUserRepository.save(user);

    // Log activity
    await this.logActivity(
      userId,
      user.merchantId,
      ActivityCategory.USER_MANAGEMENT,
      ActivityAction.USER_UPDATED,
      'user',
      user.id,
      'Invitation resent'
    );

    // Send invitation email
    await this.sendInvitationEmail(updatedUser);

    return updatedUser;
  }

  // Role Management
  async getRoles(merchantId: string, includeSystem?: boolean): Promise<UserRole[]> {
    const query = this.userRoleRepository
      .createQueryBuilder('role')
      .where('role.merchantId = :merchantId', { merchantId });

    if (!includeSystem) {
      query.andWhere('role.isSystemRole = :isSystemRole', { isSystemRole: false });
    }

    return query.orderBy('role.createdAt', 'DESC').getMany();
  }

  async getSystemRoles(query: GetSystemRolesDto): Promise<UserRole[]> {
    // Return system role templates
    const systemRoles = [
      UserRole.createOwnerRole('', ''),
      UserRole.createAdminRole('', ''),
      UserRole.createManagerRole('', ''),
      UserRole.createAnalystRole('', ''),
      UserRole.createViewerRole('', ''),
    ];

    // Filter based on query parameters
    let filteredRoles = systemRoles;

    if (query.type) {
      filteredRoles = filteredRoles.filter(role => role.type === query.type);
    }

    if (query.has_permissions && query.has_permissions.length > 0) {
      filteredRoles = filteredRoles.filter(role =>
        query.has_permissions!.some(permission => role.hasPermission(permission))
      );
    }

    return filteredRoles;
  }

  async createRole(createRoleData: CreateRoleDto): Promise<UserRole> {
    // This would need merchant_id from context
    // Placeholder implementation
    throw new BadRequestException('Merchant context required for role creation');
  }

  async updateRole(roleId: string, updateData: UpdateRoleDto): Promise<UserRole> {
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystemRole) {
      throw new BadRequestException('Cannot modify system roles');
    }

    Object.assign(role, updateData);

    return this.userRoleRepository.save(role);
  }

  async deleteRole(roleId: string): Promise<void> {
    const role = await this.userRoleRepository.findOne({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.userRoleRepository.remove(role);
  }

  async assignRoles(userId: string, assignData: AssignRoleDto): Promise<UserRole[]> {
    const user = await this.getUser(userId);

    if (assignData.role_id) {
      // Assign existing role
      const role = await this.userRoleRepository.findOne({
        where: { id: assignData.role_id }
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Check if user already has this role
      const existingRole = await this.userRoleRepository.findOne({
        where: { userId, id: assignData.role_id }
      });

      if (existingRole) {
        throw new ConflictException('User already has this role');
      }

      const userRole = this.userRoleRepository.create({
        merchantId: user.merchantId,
        userId,
        name: role.name,
        description: role.description,
        type: role.type,
        permissions: role.permissions,
        isSystemRole: role.isSystemRole,
      });

      await this.userRoleRepository.save(userRole);
    } else if (assignData.new_role) {
      // Create and assign new role
      const newRole = this.userRoleRepository.create({
        merchantId: user.merchantId,
        userId,
        ...assignData.new_role,
      });

      await this.userRoleRepository.save(newRole);
    }

    // Return updated roles
    return this.userRoleRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, id: roleId }
    });

    if (!userRole) {
      throw new NotFoundException('User role assignment not found');
    }

    await this.userRoleRepository.remove(userRole);
  }

  // Permission Management
  async checkPermission(checkData: CheckPermissionDto): Promise<{ hasPermission: boolean, roles: string[] }> {
    const user = await this.getUser(checkData.user_id);

    const userRoles = await this.userRoleRepository.find({
      where: { userId: checkData.user_id, isActive: true }
    });

    const hasPermission = userRoles.some(role => role.hasPermission(checkData.permission));

    return {
      hasPermission,
      roles: userRoles.map(role => role.name)
    };
  }

  // Activity Tracking
  async getUserActivity(userId: string, query: GetActivityDto): Promise<{ activities: UserActivity[], total: number }> {
    const qb = this.userActivityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId });

    if (query.category) {
      qb.andWhere('activity.category = :category', { category: query.category });
    }

    if (query.action) {
      qb.andWhere('activity.action = :action', { action: query.action });
    }

    if (query.resource_type) {
      qb.andWhere('activity.resourceType = :resourceType', { resourceType: query.resource_type });
    }

    if (query.resource_id) {
      qb.andWhere('activity.resourceId = :resourceId', { resourceId: query.resource_id });
    }

    if (query.success !== undefined) {
      qb.andWhere('activity.success = :success', { success: query.success });
    }

    if (query.start_date) {
      qb.andWhere('activity.createdAt >= :startDate', { startDate: query.start_date });
    }

    if (query.end_date) {
      qb.andWhere('activity.createdAt <= :endDate', { endDate: query.end_date });
    }

    const [activities, total] = await qb
      .orderBy('activity.createdAt', 'DESC')
      .take(query.limit || 50)
      .skip(query.offset || 0)
      .getManyAndCount();

    return { activities, total };
  }

  async getAuditLog(merchantId: string, query: GetAuditLogDto): Promise<{ activities: UserActivity[], total: number, failed: number }> {
    const qb = this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.merchantId = :merchantId', { merchantId });

    if (query.user_id) {
      qb.andWhere('activity.userId = :userId', { userId: query.user_id });
    }

    if (query.category) {
      qb.andWhere('activity.category = :category', { category: query.category });
    }

    if (query.action) {
      qb.andWhere('activity.action = :action', { action: query.action });
    }

    if (query.resource_type) {
      qb.andWhere('activity.resourceType = :resourceType', { resourceType: query.resource_type });
    }

    if (query.security_only) {
      qb.andWhere('activity.category IN (:...securityCategories)', {
        securityCategories: [ActivityCategory.SECURITY, ActivityCategory.AUTHENTICATION]
      });
    }

    if (query.failures_only) {
      qb.andWhere('activity.success = :success', { success: false });
    }

    if (query.start_date) {
      qb.andWhere('activity.createdAt >= :startDate', { startDate: query.start_date });
    }

    if (query.end_date) {
      qb.andWhere('activity.createdAt <= :endDate', { endDate: query.end_date });
    }

    const [activities, total] = await qb
      .orderBy('activity.createdAt', 'DESC')
      .take(query.limit || 100)
      .skip(query.offset || 0)
      .getManyAndCount();

    // Count failed activities
    const failedQuery = qb.clone();
    const failedCount = await failedQuery
      .andWhere('activity.success = :success', { success: false })
      .getCount();

    return { activities, total, failed: failedCount };
  }

  // User Statistics
  async getUserStats(merchantId: string, query: GetUserStatsDto): Promise<any> {
    const baseQuery = this.merchantUserRepository
      .createQueryBuilder('user')
      .where('user.merchantId = :merchantId', { merchantId });

    if (query.start_date) {
      baseQuery.andWhere('user.createdAt >= :startDate', { startDate: query.start_date });
    }

    if (query.end_date) {
      baseQuery.andWhere('user.createdAt <= :endDate', { endDate: query.end_date });
    }

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      suspendedUsers
    ] = await Promise.all([
      baseQuery.clone().getCount(),
      baseQuery.clone().andWhere('user.status = :status', { status: UserStatus.ACTIVE }).getCount(),
      baseQuery.clone().andWhere('user.status = :status', { status: UserStatus.INACTIVE }).getCount(),
      baseQuery.clone().andWhere('user.status = :status', { status: UserStatus.PENDING }).getCount(),
      baseQuery.clone().andWhere('user.status = :status', { status: UserStatus.SUSPENDED }).getCount(),
    ]);

    // Get user activity statistics
    const activityStats = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('activity.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('activity.merchantId = :merchantId', { merchantId })
      .groupBy('activity.category')
      .getRawMany();

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      suspendedUsers,
      activityStats,
      recentLogins: await this.getRecentLoginStats(merchantId, query)
    };
  }

  // Bulk Operations
  async bulkOperation(bulkData: BulkUserOperationDto): Promise<any> {
    const results: any = {
      success: [],
      failed: [],
      total: bulkData.user_ids.length
    };

    for (const userId of bulkData.user_ids) {
      try {
        switch (bulkData.operation) {
          case 'activate':
            await this.activateUser(userId);
            break;
          case 'deactivate':
            await this.deactivateUser(userId);
            break;
          case 'delete':
            await this.deleteUser(userId);
            break;
          case 'send_invitation':
            await this.resendInvitation(userId);
            break;
          default:
            throw new BadRequestException(`Unknown operation: ${bulkData.operation}`);
        }
        results.success.push(userId);
      } catch (error) {
        results.failed.push({ userId, error: (error as Error).message });
      }
    }

    return results;
  }

  async bulkAssignRoles(bulkData: BulkRoleAssignmentDto): Promise<any> {
    const results: any = {
      success: [],
      failed: [],
      total: bulkData.user_ids.length
    };

    for (const userId of bulkData.user_ids) {
      try {
        if (bulkData.replace_existing) {
          // Remove existing roles first
          await this.userRoleRepository.delete({ userId });
        }

        await this.assignRoles(userId, {
          user_id: userId,
          role_id: bulkData.role_id
        });

        results.success.push(userId);
      } catch (error) {
        results.failed.push({ userId, error: (error as Error).message });
      }
    }

    return results;
  }

  // Import/Export
  async importUsers(importData: ImportUsersDto): Promise<any> {
    const results: any = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const userData of importData.users) {
      try {
        const existingUser = await this.merchantUserRepository.findOne({
          where: { email: userData.email }
        });

        if (existingUser && importData.skip_duplicates) {
          results.skipped++;
          continue;
        }

        if (existingUser) {
          results.failed++;
          results.errors.push(`User ${userData.email} already exists`);
          continue;
        }

        await this.createUser({
          ...userData,
          send_invitation: importData.send_invitations
        });

        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${userData.email}: ${error.message}`);
      }
    }

    return results;
  }

  async exportUsers(exportData: ExportUsersDto): Promise<any> {
    const query = this.merchantUserRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'roles');

    if (exportData.status) {
      query.andWhere('user.status = :status', { status: exportData.status });
    }

    if (exportData.role) {
      query.andWhere('EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = user.id AND ur.name = :role)', { role: exportData.role });
    }

    const users = await query.getMany();

    // Format for export
    const exportData_formatted = users.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      status: user.status,
      roles: user.userRoles.map(role => role.name),
      created_at: user.createdAt,
      last_login_at: user.lastLoginAt
    }));

    return {
      data: exportData_formatted,
      format: exportData.format || 'json',
      count: users.length
    };
  }

  // User Status Management
  async activateUser(userId: string): Promise<MerchantUser> {
    const user = await this.getUser(userId);
    user.status = UserStatus.ACTIVE;
    return this.merchantUserRepository.save(user);
  }

  async deactivateUser(userId: string): Promise<MerchantUser> {
    const user = await this.getUser(userId);
    user.status = UserStatus.INACTIVE;
    return this.merchantUserRepository.save(user);
  }

  async resetUserPassword(userId: string): Promise<any> {
    const user = await this.getUser(userId);

    // Generate reset token
    const resetToken = this.generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpiresAt = expiresAt;

    await this.merchantUserRepository.save(user);

    // Send password reset email
    await this.sendPasswordResetEmail(user);

    return {
      userId: user.id,
      email: user.email,
      resetToken,
      expiresAt
    };
  }

  // Helper Methods
  private generateInvitationToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private generatePasswordResetToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private async logActivity(
    userId: string,
    merchantId: string,
    category: ActivityCategory,
    action: ActivityAction,
    resourceType?: string,
    resourceId?: string,
    resourceName?: string,
    metadata?: object
  ): Promise<void> {
    const activity = this.userActivityRepository.create({
      userId,
      merchantId,
      category,
      action,
      resourceType,
      resourceId,
      resourceName,
      metadata,
      success: true
    });

    await this.userActivityRepository.save(activity);
  }

  private async sendInvitationEmail(user: MerchantUser, customMessage?: string): Promise<void> {
    // Placeholder for email sending logic
    this.logger.log(`Sending invitation email to ${user.email}`);
    // In a real implementation, you would use an email service
  }

  private async sendPasswordResetEmail(user: MerchantUser): Promise<void> {
    // Placeholder for email sending logic
    this.logger.log(`Sending password reset email to ${user.email}`);
    // In a real implementation, you would use an email service
  }

  private async getRecentLoginStats(merchantId: string, query: GetUserStatsDto): Promise<any> {
    // Placeholder for login statistics
    return {
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };
  }
}
