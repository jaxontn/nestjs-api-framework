import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';

export enum ScheduleFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('scheduled_reports')
export class ScheduledReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'report_template_id' })
  reportTemplateId: string;

  @Column({ name: 'scheduled_by' })
  scheduledBy: string; // User ID who scheduled it

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  parameters: object; // Report parameters and filters

  @Column({
    type: 'enum',
    enum: ScheduleFrequency
  })
  frequency: ScheduleFrequency;

  @Column({ name: 'next_run_at' })
  nextRunAt: Date; // When the report should run next

  @Column({ name: 'last_run_at', nullable: true })
  lastRunAt: Date; // When the report last ran

  @Column({ name: 'end_date', nullable: true })
  endDate: Date; // For recurring reports, when to stop

  @Column({
    type: 'enum',
    enum: ScheduleStatus
  })
  status: ScheduleStatus;

  @Column({ type: 'simple-array' })
  recipients: string[]; // Email addresses to send report to

  @Column({ name: 'delivery_method', default: 'email' })
  deliveryMethod: string; // 'email', 'download', 'webhook'

  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl: string; // Webhook URL for delivery

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get isRecurring(): boolean {
    return this.frequency !== ScheduleFrequency.ONCE;
  }

  get isDueToRun(): boolean {
    return this.isActive &&
           this.status === ScheduleStatus.ACTIVE &&
           this.nextRunAt <= new Date();
  }

  get nextRunAfterDate(): Date | null {
    if (!this.lastRunAt) return this.nextRunAt;

    const frequencyMs = this.getFrequencyInMilliseconds();
    return new Date(this.lastRunAt.getTime() + frequencyMs);
  }

  private getFrequencyInMilliseconds(): number {
    switch (this.frequency) {
      case ScheduleFrequency.DAILY:
        return 24 * 60 * 60 * 1000;
      case ScheduleFrequency.WEEKLY:
        return 7 * 24 * 60 * 60 * 1000;
      case ScheduleFrequency.MONTHLY:
        return 30 * 24 * 60 * 60 * 1000;
      case ScheduleFrequency.QUARTERLY:
        return 90 * 24 * 60 * 60 * 1000;
      case ScheduleFrequency.YEARLY:
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }
}