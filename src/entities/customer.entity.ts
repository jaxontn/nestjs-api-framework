import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from './merchant.entity';
import { GameSession } from './game-session.entity';
import { Leaderboard } from './leaderboard.entity';
import { LoyaltyTransaction } from './loyalty-transaction.entity';
import { UserChallenge } from './user-challenge.entity';

@Entity('customers')
export class Customer {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  instagram: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', nullable: true })
  age_group: string;

  @Column({ type: 'varchar', nullable: true })
  gender: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ type: 'int', default: 0 })
  total_points: number;

  @Column({ type: 'int', default: 0 })
  games_played: number;

  @Column({ type: 'timestamp', nullable: true })
  last_play_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  first_play_date: Date;

  @Column({ type: 'int', default: 0 })
  total_session_duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  average_session_duration: number;

  @Column({ type: 'varchar', nullable: true })
  preferred_game_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  engagement_score: number;

  @Column({ type: 'varchar', length: 20, default: 'new' })
  customer_segment: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.customers)
  merchant: Merchant;

  @OneToMany(() => GameSession, session => session.customer)
  game_sessions: GameSession[];

  @OneToMany(() => Leaderboard, leaderboard => leaderboard.customer)
  leaderboards: Leaderboard[];

  @OneToMany(() => LoyaltyTransaction, transaction => transaction.customer)
  loyalty_transactions: LoyaltyTransaction[];

  @OneToMany(() => UserChallenge, userChallenge => userChallenge.customer)
  user_challenges: UserChallenge[];
}