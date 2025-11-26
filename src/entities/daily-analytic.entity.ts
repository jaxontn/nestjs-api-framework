import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Merchant } from './merchant.entity';
import { QrCampaign } from './qr-campaign.entity';

@Entity('daily_analytics')
export class DailyAnalytic {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar', nullable: true })
  campaign_id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  total_sessions: number;

  @Column({ type: 'int', default: 0 })
  unique_users: number;

  @Column({ type: 'int', default: 0 })
  new_users: number;

  @Column({ type: 'int', default: 0 })
  returning_users: number;

  @Column({ type: 'int', default: 0 })
  qr_scans: number;

  @Column({ type: 'int', default: 0 })
  game_sessions: number;

  @Column({ type: 'int', default: 0 })
  games_completed: number;

  @Column({ type: 'int', default: 0 })
  total_points_awarded: number;

  @Column({ type: 'int', default: 0 })
  total_prizes_won: number;

  @Column({ type: 'int', default: 0 })
  loyalty_points_earned: number;

  @Column({ type: 'int', default: 0 })
  loyalty_points_redeemed: number;

  @Column({ type: 'int', default: 0 })
  challenges_completed: number;

  @Column({ type: 'int', nullable: true })
  avg_session_duration: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  engagement_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  retention_rate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversion_rate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  revenue_generated: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  campaign_roi: number;

  @Column({ type: 'json', nullable: true })
  demographic_breakdown: object;

  @Column({ type: 'json', nullable: true })
  game_type_breakdown: object;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.daily_analytics)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => QrCampaign, campaign => campaign.daily_analytics)
  @JoinColumn({ name: 'campaign_id' })
  campaign: QrCampaign;
}