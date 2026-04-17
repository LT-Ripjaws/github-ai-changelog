import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RepoEntity } from './entities/repo.entity';
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
    } catch (error) {
      throw new NotFoundException('Repository not found on GitHub');
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
      status: 'pending',
    });

    const saved = await this.reposRepo.save(repoEntity);

    // Queue sync job
    await this.jobsService.addSyncJob(saved.id, userId, accessToken);

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
    await this.reposRepo.remove(repo);
    this.logger.log(`Repo deleted: ${repo.fullName} for user ${userId}`);
  }

  
   // Queue a sync job for an existing repo
   
  async queueSync(
    id: string,
    userId: string,
    accessToken: string,
  ): Promise<{ message: string }> {
    const repo = await this.findOne(id, userId);

    // Atomic check-and-update to prevent race conditions
    const result = await this.reposRepo.update(
      { id, status: In(['ready', 'error']) },
      { status: 'pending' },
    );
    if (result.affected === 0) {
      throw new ConflictException('Sync already in progress');
    }

    // Queue sync job
    await this.jobsService.addSyncJob(id, userId, accessToken);

    return { message: 'Sync queued' };
  }

  
  //  Get sync status for a repo
   
  async getStatus(id: string, userId: string): Promise<{
    status: string;
    totalCommitsSynced: number;
    errorMessage: string | null;
    lastSyncedAt: Date | null;
  }> {
    const repo = await this.findOne(id, userId);
    return {
      status: repo.status,
      totalCommitsSynced: repo.totalCommitsSynced,
      errorMessage: repo.errorMessage,
      lastSyncedAt: repo.lastSyncedAt,
    };
  }

  
   // Update repo status (called by jobs processor)
  
  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<RepoEntity> = { status };
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    if (status === 'syncing') {
      updateData.totalCommitsSynced = 0;
    }
    if (status === 'ready') {
      updateData.lastSyncedAt = new Date();
    }
    await this.reposRepo.update(id, updateData);
  }

  
   // Increment commit count (called during sync)
  async incrementCommitCount(id: string): Promise<void> {
    await this.reposRepo.increment({ id }, 'totalCommitsSynced', 1);
  }
}
