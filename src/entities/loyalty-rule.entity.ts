import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from './merchant.entity';
import { LoyaltyTransaction } from './loyalty-transaction.entity';

@Entity('loyalty_rules')
export class LoyaltyRule {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  rule_name: string;

  @Column({ type: 'varchar' })
  rule_type: string;

  @Column({ type: 'int', default: 0 })
  points_required: number;

  @Column({ type: 'int', default: 0 })
  points_awarded: number;

  @Column({ type: 'varchar', nullable: true })
  action_required: string;

  @Column({ type: 'json', nullable: true })
  action_data: object;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.loyalty_rules)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @OneToMany(() => LoyaltyTransaction, transaction => transaction.rule)
  loyalty_transactions: LoyaltyTransaction[];
}