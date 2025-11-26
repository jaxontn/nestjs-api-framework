import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from './merchant.entity';
import { GameSession } from './game-session.entity';

@Entity('game_prizes')
export class GamePrize {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  prize_name: string;

  @Column({ type: 'text', nullable: true })
  prize_description: string;

  @Column({ type: 'varchar' })
  prize_type: string;

  @Column({ type: 'varchar', nullable: true })
  game_type: string;

  @Column({ type: 'json', nullable: true })
  prize_value: object;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  win_probability: number;

  @Column({ type: 'int', nullable: true })
  quantity_available: number;

  @Column({ type: 'int', default: 0 })
  quantity_won: number;

  @Column({ type: 'int', nullable: true })
  min_score_required: number;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  difficulty_required: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.game_prizes)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @OneToMany(() => GameSession, session => session.prize)
  game_sessions: GameSession[];
}