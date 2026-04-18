import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { CommitEntity } from './commit.entity';

// This entity is for TypeORM to manage the table structure.
// All vector INSERT and SELECT operations MUST use raw SQL via DataSource.query().
// Never use TypeORM methods for the embedding column.
@Entity('commit_embeddings')
export class CommitEmbeddingEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'commit_id', unique: true }) commitId: string;

  @OneToOne(() => CommitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commit_id' }) commit: CommitEntity;

  // embedding column NOT mapped via TypeORM — managed with raw SQL only

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
