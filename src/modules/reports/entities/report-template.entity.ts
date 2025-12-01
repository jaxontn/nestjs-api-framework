import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';
import { Report } from './report.entity';

export enum TemplateType {
  CUSTOMER_EXPORT = 'customer_export',
  GAME_SESSION_EXPORT = 'game_session_export',
  CAMPAIGN_EXPORT = 'campaign_export',
  LEADERBOARD_EXPORT = 'leaderboard_export',
  ANALYTICS_REPORT = 'analytics_report',
  ACTIVITY_REPORT = 'activity_report',
  FINANCIAL_REPORT = 'financial_report',
  ENGAGEMENT_REPORT = 'engagement_report',
  LOYALTY_REPORT = 'loyalty_report',
  CHALLENGE_REPORT = 'challenge_report'
}

export enum TemplateEngine {
  HTML = 'html',
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'xlsx'
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
  TABLE = 'table'
}

@Entity('report_templates')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: TemplateType })
  type: TemplateType;

  @Column({ type: 'enum', enum: TemplateEngine })
  engine: TemplateEngine;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json' })
  template: string; // HTML/PDF template content

  @Column({ type: 'json' })
  variables: object; // Available variables and their types

  @Column({ type: 'json' })
  defaultParameters: object; // Default parameter values

  @Column({ type: 'simple-array' })
  tags: string[]; // Template tags for categorization

  @Column({ name: 'is_system_template', default: false })
  isSystemTemplate: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Report, report => report.reportTemplate)
  reports: Report[];

  // Helper methods
  get availableVariables(): Array<{ name: string; type: VariableType; description?: string }> {
    return (this.variables as any) || [];
  }

  get renderedTemplate(): string {
    return this.template || '';
  }
}