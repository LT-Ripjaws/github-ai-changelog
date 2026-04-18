import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { RepoEntity } from '../../repos/entities/repo.entity';

@Entity('releases')
export class ReleaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'repo_id' }) repoId: string;

  @ManyToOne(() => RepoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repo_id' }) repo: RepoEntity;

  @Column({ name: 'tag_name' }) tagName: string;

  @Column({ name: 'release_name', nullable: true }) releaseName: string;

  @Column({ name: 'raw_body', type: 'text', nullable: true }) rawBody: string;

  @Column({ name: 'ai_summary', type: 'text', nullable: true }) aiSummary: string;

  @Column({ name: 'breaking_changes', type: 'jsonb', default: [] }) breakingChanges: string[];

  @Column({ type: 'jsonb', default: [] }) features: string[];

  @Column({ type: 'jsonb', default: [] }) fixes: string[];

  @Column({ type: 'jsonb', default: [] }) chores: string[];

  @Column({ name: 'commits_count', default: 0 }) commitsCount: number;

  @Column({ name: 'released_at' }) releasedAt: Date;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
