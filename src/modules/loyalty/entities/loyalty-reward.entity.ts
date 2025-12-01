import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';

@Entity('loyalty_rewards')
export class LoyaltyReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  reward_config: any;

  @Column({ type: 'int', default: 0 })
  points_cost: number;

  @Column({ type: 'int', default: 100 })
  stock_quantity: number;

  @Column({ type: 'int', default: 0 })
  quantity_redeemed: number;

  @Column({ type: 'date', nullable: true })
  available_from: Date;

  @Column({ type: 'date', nullable: true })
  available_until: Date;

  @Column({ type: 'json', nullable: true })
  target_audience: any;

  @Column({ type: 'varchar', length: 50, default: 'all' })
  customer_segment_filter: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 255 })
  merchant_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  merchant: Merchant;
}