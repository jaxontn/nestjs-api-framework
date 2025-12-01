import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from '../../../entities/customer.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  transaction_type: string;

  @Column({ type: 'int' })
  points_change: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  reference_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance_before: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance_after: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reward_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reward_redemption_id: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'date', nullable: true })
  expires_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  @UpdateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'varchar', length: 255 })
  customer_id: string;

  @Column({ type: 'varchar', length: 255 })
  merchant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer: Customer;
}