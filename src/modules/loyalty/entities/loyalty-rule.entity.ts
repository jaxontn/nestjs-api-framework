import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';

@Entity('loyalty_rules')
export class LoyaltyRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  rule_config: any;

  @Column({ type: 'varchar', length: 50 })
  rule_type: string;

  @Column({ type: 'int', default: 100 })
  points_per_dollar: number;

  @Column({ type: 'int', default: 1 })
  min_points_required: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  multiplier: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  max_points_per_day: number;

  @Column({ type: 'int', default: 365 })
  validity_days: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  applies_to_new_customers_only: boolean;

  @Column({ type: 'json', nullable: true })
  target_audience: any;

  @Column({ type: 'varchar', length: 20, default: 'all' })
  customer_segment_filter: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  @UpdateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'varchar', length: 255 })
  merchant_id: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  merchant: Merchant;
}