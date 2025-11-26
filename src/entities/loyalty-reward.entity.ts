import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity('loyalty_rewards')
export class LoyaltyReward {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  reward_name: string;

  @Column({ type: 'text', nullable: true })
  reward_description: string;

  @Column({ type: 'varchar' })
  reward_type: string;

  @Column({ type: 'int' })
  points_cost: number;

  @Column({ type: 'json', nullable: true })
  reward_value: object;

  @Column({ type: 'text', nullable: true })
  redemption_instructions: string;

  @Column({ type: 'text', nullable: true })
  terms_conditions: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', nullable: true })
  stock_quantity: number;

  @Column({ type: 'int', nullable: true })
  usage_limit: number;

  @Column({ type: 'int', default: 0 })
  total_redemptions: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.loyalty_rewards)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;
}