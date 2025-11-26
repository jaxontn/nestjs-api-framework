import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Merchant } from './merchant.entity';
import { UserChallenge } from './user-challenge.entity';

@Entity('challenges')
export class Challenge {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar' })
  challenge_type: string;

  @Column({ type: 'int' })
  target_value: number;

  @Column({ type: 'int' })
  reward_points: number;

  @Column({ type: 'varchar', nullable: true })
  reward_type: string;

  @Column({ type: 'varchar', nullable: true })
  badge_icon: string;

  @Column({ type: 'varchar', nullable: true })
  badge_color: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
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

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.challenges)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @OneToMany(() => UserChallenge, userChallenge => userChallenge.challenge)
  user_challenges: UserChallenge[];
}