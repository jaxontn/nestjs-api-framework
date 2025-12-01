import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';
import { UserRole } from './user-role.entity';
import { UserActivity } from './user-activity.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum Permission {
  // QR Campaign Management
  CREATE_QR_CAMPAIGNS = 'create_qr_campaigns',
  EDIT_QR_CAMPAIGNS = 'edit_qr_campaigns',
  DELETE_QR_CAMPAIGNS = 'delete_qr_campaigns',
  VIEW_QR_CAMPAIGNS = 'view_qr_campaigns',

  // Game Management
  CREATE_GAMES = 'create_games',
  EDIT_GAMES = 'edit_games',
  DELETE_GAMES = 'delete_games',
  VIEW_GAMES = 'view_games',

  // Customer Management
  VIEW_CUSTOMERS = 'view_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  EXPORT_CUSTOMER_DATA = 'export_customer_data',

  // Analytics and Reports
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_REPORTS = 'export_reports',
  VIEW_DASHBOARD = 'view_dashboard',

  // User Management
  MANAGE_USERS = 'manage_users',
  INVITE_USERS = 'invite_users',
  VIEW_USER_ACTIVITY = 'view_user_activity',

  // Loyalty Program
  MANAGE_LOYALTY_PROGRAM = 'manage_loyalty_program',
  VIEW_LOYALTY_DATA = 'view_loyalty_data',

  // Challenge System
  MANAGE_CHALLENGES = 'manage_challenges',
  VIEW_CHALLENGES = 'view_challenges',

  // Account Settings
  MANAGE_ACCOUNT_SETTINGS = 'manage_account_settings',
  VIEW_BILLING = 'view_billing',
  MANAGE_BILLING = 'manage_billing',

  // Full Admin Access
  FULL_ACCESS = 'full_access'
}

@Entity('merchant_users')
export class MerchantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, merchant => merchant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ unique: true })
  email: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  status: UserStatus;

  @Column({ name: 'is_owner', default: false })
  isOwner: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'invitation_token', nullable: true, unique: true })
  invitationToken: string;

  @Column({ name: 'invitation_expires_at', nullable: true })
  invitationExpiresAt: Date;

  @Column({ name: 'password_reset_token', nullable: true, unique: true })
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires_at', nullable: true })
  passwordResetExpiresAt: Date;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', nullable: true })
  twoFactorSecret: string;

  @Column({ name: 'login_attempts', default: 0 })
  loginAttempts: number;

  @Column({ name: 'locked_until', nullable: true })
  lockedUntil: Date;

  @OneToMany(() => UserRole, userRole => userRole.user, { cascade: true })
  userRoles: UserRole[];

  @OneToMany(() => UserActivity, activity => activity.user, { cascade: true })
  activities: UserActivity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get canAttemptLogin(): boolean {
    return !this.isLocked && this.isActive;
  }
}