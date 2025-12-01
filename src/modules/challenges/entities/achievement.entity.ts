import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Customer } from '../../../entities/customer.entity';
import { Merchant } from '../../../entities/merchant.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  icon: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 20, default: 'bronze' })
  tier: string; // bronze, silver, gold, platinum

  @Column({ type: 'int', default: 0 })
  points_reward: number;

  @Column({ type: 'json', nullable: true })
  criteria: any;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 255 })
  merchant_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  merchant: Merchant;
}

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  customer_id: string;

  @Column({ type: 'varchar', length: 255 })
  achievement_id: string;

  @Column({ type: 'timestamp' })
  unlocked_at: Date;

  @Column({ type: 'json', nullable: true })
  progress_data: any;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer: Customer;

  @ManyToOne(() => Achievement, { onDelete: 'CASCADE' })
  achievement: Achievement;
}