import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Merchant } from './merchant.entity';
import { QrCampaign } from './qr-campaign.entity';

@Entity('merchant_users')
export class MerchantUser {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', length: 50, default: 'admin' })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.users)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @OneToMany(() => QrCampaign, campaign => campaign.created_by_user)
  created_campaigns: QrCampaign[];
}