import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  token: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('timestamp')
  expiresAt: Date;

  @Column('boolean', { default: false })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column('text', { nullable: true })
  userAgent: string;

  @Column('text', { nullable: true })
  ipAddress: string;
}