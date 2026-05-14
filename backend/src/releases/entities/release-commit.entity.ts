import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { ReleaseEntity } from './release.entity';
import type { CommitEntity } from '../../commits/entities/commit.entity';

@Entity('release_commits')
export class ReleaseCommitEntity {
  @PrimaryColumn({ name: 'release_id' }) releaseId: string;

  @PrimaryColumn({ name: 'commit_id' }) commitId: string;

  @ManyToOne('ReleaseEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'release_id' }) release: Relation<ReleaseEntity>;

  @ManyToOne('CommitEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commit_id' }) commit: Relation<CommitEntity>;
}
