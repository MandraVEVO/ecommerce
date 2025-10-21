import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  token: string;

  @Column('uuid')
  userId: string;

  @Column('timestamp')
  expiresAt: Date;

  @CreateDateColumn()
  blacklistedAt: Date;

  @Column('text', { nullable: true })
  reason: string;
}