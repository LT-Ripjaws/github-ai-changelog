import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { ReleaseEntity } from './release.entity';
import { CommitEntity } from '../../commits/entities/commit.entity';

@Entity('release_commits')
export class ReleaseCommitEntity {
  @PrimaryColumn({ name: 'release_id' }) releaseId: string;

  @PrimaryColumn({ name: 'commit_id' }) commitId: string;

  @ManyToOne(() => ReleaseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'release_id' }) release: ReleaseEntity;

  @ManyToOne(() => CommitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commit_id' }) commit: CommitEntity;
}
