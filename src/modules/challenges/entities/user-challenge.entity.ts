import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Customer } from '../../../entities/customer.entity';
import { Challenge } from './challenge.entity';

@Entity('user_challenges')
export class UserChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  customer_id: string;

  @Column({ type: 'varchar', length: 255 })
  challenge_id: string;

  @Column({ type: 'int', default: 0 })
  current_progress: number;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'boolean', default: false })
  reward_claimed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  claimed_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  started_at: Date;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer: Customer;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  challenge: Challenge;
}