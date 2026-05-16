import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { UserEntity } from '../../users/entities/user.entity';
import type { CommitEntity } from '../../commits/entities/commit.entity';
import type { ReleaseEntity } from '../../releases/entities/release.entity';

export enum RepoStatus { Pending = 'pending', Syncing = 'syncing', Ready = 'ready', Error = 'error' }

@Entity('repos')
@Index('idx_repos_user_created_at', ['userId', 'createdAt'])
export class RepoEntity {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ name: 'user_id' }) 
  userId: string;

  @ManyToOne(
    'UserEntity',
    'repos',
    { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) 
  user: Relation<UserEntity>;

  @Column({ name: 'github_repo_id' }) 
  githubRepoId: string;

  @Column({ name: 'full_name' }) 
  fullName: string;

  @Column() 
  name: string;
  
  @Column({ nullable: true }) 
  description: string;

  @Column({ name: 'default_branch', default: 'main' }) 
  defaultBranch: string;

  @Column({ name: 'is_private', default: false }) 
  isPrivate: boolean;

  @Column({ name: 'stars_count', default: 0 }) 
  starsCount: number;

  @Column({ nullable: true }) 
  language: string;

  @Column({ type: 'simple-enum', enum: RepoStatus, default: RepoStatus.Pending })
  status: RepoStatus;
   
  @Column({ name: 'error_message', nullable: true }) 
  errorMessage: string;

  @Column({ name: 'last_synced_at', nullable: true }) 
  lastSyncedAt: Date;

  @Column({ name: 'total_commits_synced', default: 0 })
  totalCommitsSynced: number;

  @Column({ name: 'total_commits_to_sync', default: 0 })
  totalCommitsToSync: number;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('CommitEntity', 'repo') commits: Relation<CommitEntity[]>;
  @OneToMany('ReleaseEntity', 'repo') releases: Relation<ReleaseEntity[]>;
}
