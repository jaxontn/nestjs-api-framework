import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';
import { Merchant } from './merchant.entity';
import { LoyaltyRule } from './loyalty-rule.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  customer_id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar', nullable: true })
  rule_id: string;

  @Column({ type: 'varchar' })
  transaction_type: string;

  @Column({ type: 'int' })
  points_change: number;

  @Column({ type: 'int' })
  current_balance: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  transaction_description: string;

  @Column({ type: 'json', nullable: true })
  metadata: object;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relationships
  @ManyToOne(() => Customer, customer => customer.loyalty_transactions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Merchant, merchant => merchant.id)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => LoyaltyRule, rule => rule.loyalty_transactions)
  @JoinColumn({ name: 'rule_id' })
  rule: LoyaltyRule;
}