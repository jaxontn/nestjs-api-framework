import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from '../../../entities/merchant.entity';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  merchant_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, comment: '"game_master", "points_collector", "daily_streak", "social"' })
  challenge_type: string;

  @Column({ type: 'int' })
  target_value: number;

  @Column({ type: 'int' })
  reward_points: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reward_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge_icon: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  badge_color: string;

  @Column({ type: 'varchar', length: 20, default: 'medium', comment: '"easy", "medium", "hard"' })
  difficulty_level: string;

  @Column({ type: 'int', nullable: true })
  max_participants: number;

  @Column({ type: 'int', default: 0 })
  current_participants: number;

  @Column({ type: 'int', default: 0 })
  completion_count: number;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  merchant: Merchant;
}