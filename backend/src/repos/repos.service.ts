import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RepoEntity, RepoStatus } from './entities/repo.entity';
import { GithubService } from './github.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class ReposService {
  private readonly logger = new Logger(ReposService.name);

  constructor(
    @InjectRepository(RepoEntity)
    private reposRepo: Repository<RepoEntity>,
    private githubService: GithubService,
    private jobsService: JobsService,
  ) {}

  
    // Create a new repo connection and queue sync
   
  async create(
    dto: CreateRepoDto,
    userId: string,
    accessToken: string,
  ): Promise<RepoEntity> {
    const [owner, repo] = dto.fullName.split('/');

    // Check if already connected
    const existing = await this.reposRepo.findOne({
      where: { userId, fullName: dto.fullName },
    });
    if (existing) {
      throw new ConflictException('Repository already connected');
    }

    // Validate repo exists on GitHub
    let githubRepo;
    try {
      githubRepo = await this.githubService.getRepo(owner, repo, accessToken);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Repository not found on GitHub';
      throw new NotFoundException(message);
    }

    // Create repo record
    const repoEntity = this.reposRepo.create({
      userId,
      githubRepoId: String(githubRepo.id),
      fullName: githubRepo.full_name,
      name: githubRepo.name,
      description: githubRepo.description,
      defaultBranch: githubRepo.default_branch,
      isPrivate: githubRepo.private,
      starsCount: githubRepo.stargazers_count,
      language: githubRepo.language,
      status: RepoStatus.Pending,
    });

    const saved = await this.reposRepo.save(repoEntity);

    await this.jobsService.addSyncJob(saved.id);

    this.logger.log(`Repo created: ${dto.fullName} for user ${userId}`);
    return saved;
  }

  
  // Get all repos for a user
   
  async findAll(userId: string): Promise<RepoEntity[]> {
    return this.reposRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  
  // Get a single repo by ID (must belong to user)
   
  async findOne(id: string, userId: string): Promise<RepoEntity> {
    const repo = await this.reposRepo.findOne({ where: { id, userId } });
    if (!repo) {
      throw new NotFoundException('Repository not found');
    }
    return repo;
  }

  
   // Delete a repo (cascades to commits, embeddings, releases)
   
  async remove(id: string, userId: string): Promise<void> {
    const repo = await this.findOne(id, userId);

    // Cancel any active/queued sync jobs before deleting
    await this.jobsService.cancelJobsForRepo(id);

    await this.reposRepo.remove(repo);
    this.logger.log(`Repo deleted: ${repo.fullName} for user ${userId}`);
  }

  async queueSync(
    id: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.findOne(id, userId);

    // Atomic check-and-update to prevent race conditions
    // Only ready/error repos can be queued. Pending/syncing already have work in flight.
    const result = await this.reposRepo.update(
      { id, status: In(['ready', 'error']) },
      { status: RepoStatus.Pending },
    );
    if (result.affected === 0) {
      throw new ConflictException('Sync already in progress');
    }

    await this.jobsService.addSyncJob(id);

    return { message: 'Sync queued' };
  }

  
  //  Get sync status for a repo
   
  async getStatus(id: string, userId: string): Promise<{
    status: string;
    totalCommitsSynced: number;
    totalCommitsToSync: number;
    errorMessage: string | null;
    lastSyncedAt: Date | null;
  }> {
    const repo = await this.findOne(id, userId);
    return {
      status: repo.status,
      totalCommitsSynced: repo.totalCommitsSynced,
      totalCommitsToSync: repo.totalCommitsToSync,
      errorMessage: repo.errorMessage,
      lastSyncedAt: repo.lastSyncedAt,
    };
  }

  
   // Update repo status (called by jobs processor)
  
  async updateStatus(
    id: string,
    status: RepoStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: {
      status: RepoStatus;
      errorMessage?: string;
      totalCommitsSynced?: number;
      totalCommitsToSync?: number;
      lastSyncedAt?: Date;
    } = { status };
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    if (status === RepoStatus.Syncing) {
      // Don't reset totalCommitsSynced if repo already has commits (re-sync case)
      // The count will be corrected at the end of sync
      const repo = await this.reposRepo.findOne({ where: { id } });
      if (!repo || repo.totalCommitsSynced === 0) {
        updateData.totalCommitsSynced = 0;
      }
      // Preserve old totalCommitsToSync during re-sync so the frontend
      // progress bar shows meaningful data while IngestionService fetches
      // the new count. Only reset to 0 if there's no previous value.
      if (!repo || repo.totalCommitsToSync === 0) {
        updateData.totalCommitsToSync = 0;
      }
    }
    if (status === RepoStatus.Ready) {
      updateData.lastSyncedAt = new Date();
    }
    await this.reposRepo.update(id, updateData);
  }

}
