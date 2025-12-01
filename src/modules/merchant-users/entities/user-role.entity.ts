import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { MerchantUser } from './merchant-user.entity';

export enum RoleType {
  SYSTEM = 'system',      // Built-in system roles
  CUSTOM = 'custom',       // Merchant-defined custom roles
}

// Predefined role templates
export enum SystemRole {
  OWNER = 'owner',                    // Full access to everything
  ADMIN = 'admin',                    // Almost full access except billing
  MANAGER = 'manager',                // Can manage campaigns, games, users
  ANALYST = 'analyst',                // Can view analytics and reports
  CAMPAIGN_MANAGER = 'campaign_manager', // Can manage QR campaigns only
  GAME_MANAGER = 'game_manager',      // Can manage games only
  CUSTOMER_SERVICE = 'customer_service', // Can manage customers only
  VIEWER = 'viewer',                  // Read-only access
}

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => MerchantUser, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: MerchantUser;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.CUSTOM
  })
  type: RoleType;

  @Column({
    type: 'simple-array',
    nullable: true
  })
  permissions: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => MerchantUser, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: MerchantUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) || false;
  }

  hasPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  addPermission(permission: string): void {
    if (!this.permissions) {
      this.permissions = [];
    }
    if (!this.hasPermission(permission)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permission: string): void {
    if (this.permissions) {
      this.permissions = this.permissions.filter(p => p !== permission);
    }
  }

  // Static methods for creating system roles
  static createOwnerRole(merchantId: string, userId: string): UserRole {
    const role = new UserRole();
    role.merchantId = merchantId;
    role.userId = userId;
    role.name = 'Owner';
    role.description = 'Full access to all merchant features and settings';
    role.type = RoleType.SYSTEM;
    role.isSystemRole = true;
    role.permissions = Object.values(require('./merchant-user.entity').Permission);
    return role;
  }

  static createAdminRole(merchantId: string, userId: string): UserRole {
    const role = new UserRole();
    role.merchantId = merchantId;
    role.userId = userId;
    role.name = 'Admin';
    role.description = 'Administrative access to most features';
    role.type = RoleType.SYSTEM;
    role.isSystemRole = true;
    role.permissions = [
      'create_qr_campaigns', 'edit_qr_campaigns', 'view_qr_campaigns',
      'create_games', 'edit_games', 'view_games',
      'view_customers', 'edit_customers', 'export_customer_data',
      'view_analytics', 'export_reports', 'view_dashboard',
      'manage_users', 'invite_users', 'view_user_activity',
      'manage_loyalty_program', 'view_loyalty_data',
      'manage_challenges', 'view_challenges',
      'manage_account_settings'
    ];
    return role;
  }

  static createManagerRole(merchantId: string, userId: string): UserRole {
    const role = new UserRole();
    role.merchantId = merchantId;
    role.userId = userId;
    role.name = 'Manager';
    role.description = 'Can manage campaigns, games, and team members';
    role.type = RoleType.SYSTEM;
    role.isSystemRole = true;
    role.permissions = [
      'create_qr_campaigns', 'edit_qr_campaigns', 'view_qr_campaigns',
      'create_games', 'edit_games', 'view_games',
      'view_customers', 'edit_customers',
      'view_analytics', 'view_dashboard',
      'invite_users', 'view_user_activity',
      'manage_loyalty_program', 'view_loyalty_data',
      'manage_challenges', 'view_challenges'
    ];
    return role;
  }

  static createAnalystRole(merchantId: string, userId: string): UserRole {
    const role = new UserRole();
    role.merchantId = merchantId;
    role.userId = userId;
    role.name = 'Analyst';
    role.description = 'Read-only access to analytics and reports';
    role.type = RoleType.SYSTEM;
    role.isSystemRole = true;
    role.permissions = [
      'view_qr_campaigns',
      'view_games',
      'view_customers',
      'view_analytics', 'export_reports',
      'view_loyalty_data',
      'view_challenges'
    ];
    return role;
  }

  static createViewerRole(merchantId: string, userId: string): UserRole {
    const role = new UserRole();
    role.merchantId = merchantId;
    role.userId = userId;
    role.name = 'Viewer';
    role.description = 'Read-only access to most features';
    role.type = RoleType.SYSTEM;
    role.isSystemRole = true;
    role.permissions = [
      'view_qr_campaigns',
      'view_games',
      'view_customers',
      'view_analytics',
      'view_dashboard',
      'view_loyalty_data',
      'view_challenges'
    ];
    return role;
  }
}