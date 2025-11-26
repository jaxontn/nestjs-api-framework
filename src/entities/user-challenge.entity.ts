import { Entity, PrimaryColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';
import { Challenge } from './challenge.entity';

@Entity('user_challenges')
export class UserChallenge {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  customer_id: string;

  @Column({ type: 'varchar' })
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

  @CreateDateColumn({ name: 'started_at' })
  started_at: Date;

  // Relationships
  @ManyToOne(() => Customer, customer => customer.user_challenges)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Challenge, challenge => challenge.user_challenges)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;
}