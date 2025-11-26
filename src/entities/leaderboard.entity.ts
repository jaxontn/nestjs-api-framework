import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Merchant } from './merchant.entity';
import { Customer } from './customer.entity';

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  customer_id: string;

  @Column({ type: 'varchar', nullable: true })
  game_type: string;

  @Column({ type: 'varchar', length: 20, default: 'alltime' })
  period_type: string;

  @Column({ type: 'timestamp' })
  period_start: Date;

  @Column({ type: 'timestamp' })
  period_end: Date;

  @Column({ type: 'int' })
  rank_position: number;

  @Column({ type: 'int', default: 0 })
  best_score: number;

  @Column({ type: 'int', default: 0 })
  games_played: number;

  @Column({ type: 'int', default: 0 })
  total_points: number;

  @Column({ type: 'varchar', nullable: true })
  achievement: string;

  @Column({ type: 'int', nullable: true })
  previous_rank: number;

  @CreateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.leaderboards)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Customer, customer => customer.leaderboards)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}