import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { QrCampaign } from './qr-campaign.entity';
import { GamePrize } from './game-prize.entity';

@Entity('game_sessions')
export class GameSession {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  customer_id: string;

  @Column({ type: 'varchar', nullable: true })
  campaign_id: string;

  @Column({ type: 'varchar' })
  game_type: string;

  @Column({ type: 'int', default: 0 })
  points_earned: number;

  @Column({ type: 'int', nullable: true })
  session_duration: number;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  difficulty_level: string;

  @Column({ type: 'boolean', default: false })
  was_completed: boolean;

  @Column({ type: 'varchar', nullable: true })
  prize_won: string;

  @Column({ type: 'json', nullable: true })
  game_data: object;

  @Column({ type: 'json', nullable: true })
  device_info: object;

  @CreateDateColumn({ name: 'started_at' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  // Relationships
  @ManyToOne(() => Customer, customer => customer.game_sessions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => QrCampaign, campaign => campaign.game_sessions)
  @JoinColumn({ name: 'campaign_id' })
  campaign: QrCampaign;

  @ManyToOne(() => GamePrize, prize => prize.game_sessions)
  @JoinColumn({ name: 'prize_won' })
  prize: GamePrize;
}