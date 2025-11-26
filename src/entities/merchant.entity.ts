import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MerchantUser } from './merchant-user.entity';
import { Customer } from './customer.entity';
import { QrCampaign } from './qr-campaign.entity';
import { GameSetting } from './game-setting.entity';
import { GamePrize } from './game-prize.entity';
import { Leaderboard } from './leaderboard.entity';
import { DailyAnalytic } from './daily-analytic.entity';
import { LoyaltyRule } from './loyalty-rule.entity';
import { LoyaltyReward } from './loyalty-reward.entity';
import { Challenge } from './challenge.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  business_name: string;

  @Column({ type: 'varchar' })
  contact_name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar' })
  password_hash: string;

  @Column({ type: 'varchar', nullable: true })
  logo_url: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @OneToMany(() => MerchantUser, user => user.merchant)
  users: MerchantUser[];

  @OneToMany(() => Customer, customer => customer.merchant)
  customers: Customer[];

  @OneToMany(() => QrCampaign, campaign => campaign.merchant)
  campaigns: QrCampaign[];

  @OneToMany(() => GameSetting, setting => setting.merchant)
  game_settings: GameSetting[];

  @OneToMany(() => GamePrize, prize => prize.merchant)
  game_prizes: GamePrize[];

  @OneToMany(() => Leaderboard, leaderboard => leaderboard.merchant)
  leaderboards: Leaderboard[];

  @OneToMany(() => DailyAnalytic, analytic => analytic.merchant)
  daily_analytics: DailyAnalytic[];

  @OneToMany(() => LoyaltyRule, rule => rule.merchant)
  loyalty_rules: LoyaltyRule[];

  @OneToMany(() => LoyaltyReward, reward => reward.merchant)
  loyalty_rewards: LoyaltyReward[];

  @OneToMany(() => Challenge, challenge => challenge.merchant)
  challenges: Challenge[];
}