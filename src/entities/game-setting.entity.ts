import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity('game_settings')
export class GameSetting {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  merchant_id: string;

  @Column({ type: 'varchar' })
  game_type: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 5 })
  daily_play_limit: number;

  @Column({ type: 'int', default: 10 })
  base_points: number;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  difficulty: string;

  @Column({ type: 'json', nullable: true })
  configuration: object;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Merchant, merchant => merchant.game_settings)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;
}