import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { RepoEntity } from '../../repos/entities/repo.entity';

@Entity('commits')
@Index('idx_commits_repo_committed_at', ['repoId', 'committedAt'])
export class CommitEntity {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ name: 'repo_id' }) 
  repoId: string;

  @ManyToOne(() => RepoEntity, { 
    onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repo_id' }) 
  repo: RepoEntity;

  @Column({ unique: true }) 
  sha: string;

  @Column({ type: 'text' }) 
  message: string;

  @Column({ name: 'author_name', nullable: true }) 
  authorName: string;

  @Column({ name: 'author_email', nullable: true }) 
  authorEmail: string;

  @Column({ name: 'author_github_login', nullable: true }) 
  authorGithubLogin: string;

  @Column({ name: 'diff_summary', type: 'text', nullable: true }) 
  diffSummary: string;

  @Column({ name: 'ai_changelog', type: 'text', nullable: true }) 
  aiChangelog: string;

  @Column({ nullable: true }) 
  category: string;

  @Column({ name: 'files_changed', default: 0 }) 
  filesChanged: number;

  @Column({ default: 0 }) 
  additions: number;

  @Column({ default: 0 }) 
  deletions: number;

  @Column({ name: 'is_merge_commit', default: false }) 
  isMergeCommit: boolean;

  @Column({ name: 'committed_at' }) 
  committedAt: Date;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;
}
