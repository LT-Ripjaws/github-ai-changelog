import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { RepoEntity } from '../../repos/entities/repo.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'github_id', unique: true }) githubId: string;
  @Column() username: string;
  @Column({ name: 'display_name', nullable: true }) displayName: string;
  @Column({ name: 'avatar_url', nullable: true }) avatarUrl: string;
  @Column({ nullable: true }) email: string;
  @Column({ name: 'access_token' }) accessToken: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => RepoEntity, (r) => r.user) repos: RepoEntity[];
}
