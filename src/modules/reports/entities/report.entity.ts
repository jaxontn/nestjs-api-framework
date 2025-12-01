import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';
import { MerchantUser } from '../../merchant-users/entities/merchant-user.entity';
import { ReportTemplate } from './report-template.entity';

export enum ReportType {
  CUSTOMER_EXPORT = 'customer_export',
  GAME_SESSION_EXPORT = 'game_session_export',
  CAMPAIGN_EXPORT = 'campaign_export',
  LEADERBOARD_EXPORT = 'leaderboard_export',
  ANALYTICS_REPORT = 'analytics_report',
  ACTIVITY_REPORT = 'activity_report',
  FINANCIAL_REPORT = 'financial_report',
  ENGAGEMENT_REPORT = 'engagement_report',
  CUSTOM_REPORT = 'custom_report'
}

export enum ReportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'xlsx'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum DeliveryMethod {
  DOWNLOAD = 'download',
  EMAIL = 'email',
  WEBHOOK = 'webhook'
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => MerchantUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: MerchantUser;

  @Column({ name: 'report_template_id', nullable: true })
  reportTemplateId: string;

  @ManyToOne(() => ReportTemplate, template => template.reports, { nullable: true })
  @JoinColumn({ name: 'report_template_id' })
  reportTemplate: ReportTemplate;

  @Column({
    type: 'enum',
    enum: ReportType
  })
  type: ReportType;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  parameters: object; // Report filters and parameters

  @Column({
    type: 'enum',
    enum: ReportStatus
  })
  status: ReportStatus;

  @Column({
    type: 'enum',
    enum: ReportFormat
  })
  format: ReportFormat;

  @Column({ name: 'file_url', length: 500, nullable: true })
  fileUrl: string; // URL to download generated report

  @Column({ name: 'file_size', nullable: true })
  fileSize: number; // File size in bytes

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date; // When download link expires

  @Column({ name: 'download_count', default: 0 })
  downloadCount: number;

  @Column({
    type: 'enum',
    enum: DeliveryMethod
  })
  deliveryMethod: DeliveryMethod;

  @Column({ name: 'delivery_address', length: 255, nullable: true })
  deliveryAddress: string; // Email address or webhook URL

  @Column({ name: 'delivery_status', nullable: true })
  deliveryStatus: string; // 'sent', 'delivered', 'failed'

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: object; // Additional report data

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get isExpired(): boolean {
    return this.expiresAt && this.expiresAt < new Date();
  }

  get isCompleted(): boolean {
    return this.status === ReportStatus.COMPLETED;
  }

  get canDownload(): boolean {
    return this.isCompleted && !!this.fileUrl && !this.isExpired;
  }

  get downloadUrl(): string | null {
    if (this.canDownload) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      return `${baseUrl}/api/reports/${this.id}/download`;
    }
    return null;
  }
}