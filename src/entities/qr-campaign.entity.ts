import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from './merchant.entity';
import { MerchantUser } from './merchant-user.entity';
import { GameSession } from './game-session.entity';
import { DailyAnalytic } from './daily-analytic.entity';

@Entity('qr_campaigns')
export class QrCampaign {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar' })
  campaign_type: string;

  @Column({ type: 'varchar' })
  qr_url: string;

  @Column({ type: 'varchar', nullable: true })
  qr_code_image: string;

  @Column({ type: 'varchar', nullable: true })
  landing_page_url: string;

  @Column({ type: 'json', nullable: true })
  game_settings: object;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_spent: number;

  @Column({ type: 'json', nullable: true })
  target_audience: object;

  @Column({ type: 'int', default: 0 })
  total_scans: number;

  @Column({ type: 'int', default: 0 })
  unique_scans: number;

  @Column({ type: 'int', default: 0 })
  total_participants: number;

  @Column({ type: 'int', default: 0 })
  data_collected: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  conversion_rate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  revenue_generated: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  target_roi: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  actual_roi: number;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ type: 'varchar' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  activated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.campaigns)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => MerchantUser, user => user.created_campaigns)
  @JoinColumn({ name: 'created_by' })
  created_by_user: MerchantUser;

  @OneToMany(() => GameSession, session => session.campaign)
  game_sessions: GameSession[];

  @OneToMany(() => DailyAnalytic, analytic => analytic.campaign)
  daily_analytics: DailyAnalytic[];
}