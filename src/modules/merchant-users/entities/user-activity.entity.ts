import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { MerchantUser } from './merchant-user.entity';

export enum ActivityCategory {
  AUTHENTICATION = 'authentication',
  USER_MANAGEMENT = 'user_management',
  QR_CAMPAIGN = 'qr_campaign',
  GAME_MANAGEMENT = 'game_management',
  CUSTOMER_MANAGEMENT = 'customer_management',
  LOYALTY_PROGRAM = 'loyalty_program',
  CHALLENGE_MANAGEMENT = 'challenge_management',
  ANALYTICS = 'analytics',
  BILLING = 'billing',
  SETTINGS = 'settings',
  SECURITY = 'security',
  DATA_EXPORT = 'data_export'
}

export enum ActivityAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',

  // User Management
  USER_INVITED = 'user_invited',
  USER_ADDED = 'user_added',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',
  PERMISSIONS_UPDATED = 'permissions_updated',

  // QR Campaign Management
  QR_CAMPAIGN_CREATED = 'qr_campaign_created',
  QR_CAMPAIGN_UPDATED = 'qr_campaign_updated',
  QR_CAMPAIGN_DELETED = 'qr_campaign_deleted',
  QR_CAMPAIGN_PUBLISHED = 'qr_campaign_published',
  QR_CAMPAIGN_PAUSED = 'qr_campaign_paused',
  QR_CAMPAIGN_RESUMED = 'qr_campaign_resumed',

  // Game Management
  GAME_CREATED = 'game_created',
  GAME_UPDATED = 'game_updated',
  GAME_DELETED = 'game_deleted',
  GAME_PUBLISHED = 'game_published',
  GAME_CONFIGURATION_UPDATED = 'game_configuration_updated',

  // Customer Management
  CUSTOMER_DATA_ACCESSED = 'customer_data_accessed',
  CUSTOMER_DATA_EXPORTED = 'customer_data_exported',
  CUSTOMER_UPDATED = 'customer_updated',
  CUSTOMER_DELETED = 'customer_deleted',

  // Loyalty Program
  LOYALTY_RULE_CREATED = 'loyalty_rule_created',
  LOYALTY_RULE_UPDATED = 'loyalty_rule_updated',
  LOYALTY_RULE_DELETED = 'loyalty_rule_deleted',
  LOYALTY_REWARD_CREATED = 'loyalty_reward_created',
  LOYALTY_REWARD_UPDATED = 'loyalty_reward_updated',
  LOYALTY_REWARD_DELETED = 'loyalty_reward_deleted',
  POINTS_MANUAL_ADJUSTMENT = 'points_manual_adjustment',

  // Challenge Management
  CHALLENGE_CREATED = 'challenge_created',
  CHALLENGE_UPDATED = 'challenge_updated',
  CHALLENGE_DELETED = 'challenge_deleted',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',

  // Analytics
  REPORT_GENERATED = 'report_generated',
  REPORT_DOWNLOADED = 'report_downloaded',
  ANALYTICS_ACCESSED = 'analytics_accessed',
  DASHBOARD_ACCESSED = 'dashboard_accessed',

  // Billing
  BILLING_INFO_UPDATED = 'billing_info_updated',
  INVOICE_ACCESSED = 'invoice_accessed',
  PAYMENT_METHOD_ADDED = 'payment_method_added',
  PAYMENT_METHOD_REMOVED = 'payment_method_removed',

  // Settings
  ACCOUNT_SETTINGS_UPDATED = 'account_settings_updated',
  INTEGRATION_CONFIGURED = 'integration_configured',
  INTEGRATION_REMOVED = 'integration_removed',

  // Security
  SECURITY_SETTINGS_UPDATED = 'security_settings_updated',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',

  // Data Export
  DATA_EXPORT_REQUESTED = 'data_export_requested',
  DATA_EXPORT_COMPLETED = 'data_export_completed',
  DATA_EXPORT_FAILED = 'data_export_failed'
}

@Entity('user_activities')
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => MerchantUser, user => user.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: MerchantUser;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ActivityCategory
  })
  category: ActivityCategory;

  @Column({
    type: 'enum',
    enum: ActivityAction
  })
  action: ActivityAction;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'resource_type', nullable: true })
  resourceType: string;  // e.g., 'qr_campaign', 'game', 'customer', 'user'

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;    // ID of the affected resource

  @Column({ name: 'resource_name', nullable: true })
  resourceName: string;  // Name/description of the affected resource

  @Column({ type: 'json', nullable: true })
  metadata: object | null;      // Additional context data (old values, new values, etc.)

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ name: 'location', nullable: true })
  location: string;    // Geographic location from IP

  @Column({ name: 'success', default: true })
  success: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number;  // How long the action took

  @Column({ name: 'performed_on_behalf_of', nullable: true })
  performedOnBehalfOf: string;  // If acting on behalf of another user

  @ManyToOne(() => MerchantUser, { nullable: true })
  @JoinColumn({ name: 'performed_on_behalf_of' })
  performedOnBehalfOfUser: MerchantUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Helper methods
  static createLoginActivity(userId: string, merchantId: string, ipAddress: string, userAgent: string, success: boolean): UserActivity {
    const activity = new UserActivity();
    activity.userId = userId;
    activity.merchantId = merchantId;
    activity.category = ActivityCategory.AUTHENTICATION;
    activity.action = success ? ActivityAction.LOGIN : ActivityAction.LOGIN_FAILED;
    activity.description = success ? 'User logged in successfully' : 'User login failed';
    activity.ipAddress = ipAddress;
    activity.userAgent = userAgent;
    activity.success = success;
    return activity;
  }

  static createResourceActivity(
    userId: string,
    merchantId: string,
    action: ActivityAction,
    resourceType: string,
    resourceId: string,
    resourceName: string,
    metadata?: object,
    success: boolean = true
  ): UserActivity {
    const activity = new UserActivity();
    activity.userId = userId;
    activity.merchantId = merchantId;
    activity.action = action;
    activity.resourceType = resourceType;
    activity.resourceId = resourceId;
    activity.resourceName = resourceName;
    activity.metadata = metadata ?? null;
    activity.success = success;

    // Determine category based on resource type
    switch (resourceType) {
      case 'user':
        activity.category = ActivityCategory.USER_MANAGEMENT;
        break;
      case 'qr_campaign':
        activity.category = ActivityCategory.QR_CAMPAIGN;
        break;
      case 'game':
        activity.category = ActivityCategory.GAME_MANAGEMENT;
        break;
      case 'customer':
        activity.category = ActivityCategory.CUSTOMER_MANAGEMENT;
        break;
      case 'loyalty_rule':
      case 'loyalty_reward':
        activity.category = ActivityCategory.LOYALTY_PROGRAM;
        break;
      case 'challenge':
      case 'achievement':
        activity.category = ActivityCategory.CHALLENGE_MANAGEMENT;
        break;
      default:
        activity.category = ActivityCategory.SETTINGS;
    }

    activity.description = this.generateDescription(action, resourceType, resourceName, success);
    return activity;
  }

  private static generateDescription(action: ActivityAction, resourceType: string, resourceName: string, success: boolean): string {
    if (!success) {
      return `Failed to ${action.replace('_', ' ')} ${resourceType}: ${resourceName}`;
    }

    const actionWords = action.replace('_', ' ').replace('_', ' ');
    const resourceTypeWords = resourceType.replace('_', ' ');

    return `${actionWords.charAt(0).toUpperCase() + actionWords.slice(1)} ${resourceTypeWords}: ${resourceName}`;
  }
}