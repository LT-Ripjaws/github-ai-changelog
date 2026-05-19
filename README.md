# RepoNarrate

RepoNarrate is a full-stack AI changelog intelligence app. It connects to a GitHub repository, syncs commits and releases, uses AI to turn raw commit history into readable changelog notes, and presents the results through commits, releases, semantic search, and analytics dashboards.

In simple terms: connect a repo, let the backend sync it, then review clean AI-generated explanations of what changed.

## Preview

<p align="center">
  <img src="./screenshots/banner.jpg" alt="RepoNarrate landing hero preview" width="100%" />
</p>

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Landing Page</strong></td>
    <td align="center"><strong>Repository Dashboard</strong></td>
  </tr>
  <tr>
    <td><img src="./screenshots/landing.jpg" alt="RepoNarrate landing page" width="100%" /></td>
    <td><img src="./screenshots/dashboard.jpg" alt="RepoNarrate repository dashboard" width="100%" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Repository Workspace</strong></td>
    <td align="center"><strong>Commit Intelligence</strong></td>
  </tr>
  <tr>
    <td><img src="./screenshots/repo.jpg" alt="RepoNarrate repository workspace overview" width="100%" /></td>
    <td><img src="./screenshots/commits.jpg" alt="RepoNarrate commit intelligence list" width="100%" /></td>
  </tr>
  <tr>
    <td align="center"><strong>AI Commit Summary</strong></td>
    <td align="center"><strong>Analytics</strong></td>
  </tr>
  <tr>
    <td><img src="./screenshots/ai_summary.jpg" alt="RepoNarrate AI changelog and diff summary" width="100%" /></td>
    <td><img src="./screenshots/analytics.jpg" alt="RepoNarrate analytics dashboard" width="100%" /></td>
  </tr>
</table>

## Features

- GitHub OAuth login
- Connect public or private GitHub repositories available to the signed-in user
- Background repository sync with live progress
- AI-generated commit changelog entries
- AI-generated diff summaries
- AI commit categories: `breaking`, `feature`, `fix`, `chore`, `docs`, `refactor`
- AI-generated release summaries grouped by change type
- Natural-language semantic search over commits
- Repository analytics with category and monthly commit charts
- Protected dashboard using httpOnly cookie authentication
- Swagger API docs in development/local mode

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14, React 18, TypeScript | App Router pages, SSR, client components, typed UI |
| Styling | Tailwind CSS, custom CSS variables, Geist fonts | Dark dashboard design system |
| Charts | Recharts | Commit analytics visualizations |
| API client | Axios and server-side fetch helpers | Browser and SSR API calls |
| Backend | NestJS 11, TypeScript | Modular REST API |
| Database | PostgreSQL with pgvector | Relational data plus vector search |
| ORM | TypeORM | Entity mapping and repository access |
| Queue | Bull with Redis | Background repository sync jobs |
| Auth | GitHub OAuth, Passport, JWT | Login and protected API routes |
| AI text | OpenAI SDK against Kilo Code gateway | Diff summaries, categories, changelog entries, release summaries |
| AI embeddings | Google Gemini embeddings | Semantic commit search |
| Security | Helmet, CORS, rate limiting, CSRF origin checks | Safer cookie-based web app |

## Repository Structure

```text
github-ai-changelog/
  backend/                  NestJS API
    src/
      ai/                   AI prompts and provider calls
      analytics/            Commit analytics API
      auth/                 GitHub OAuth and JWT auth
      commits/              Commit list, detail, filters, semantic search
      common/               Guards, filters, DTOs, middleware, utilities
      jobs/                 Bull queue and sync processor
      releases/             Release list and detail API
      repos/                Repo connection, GitHub API client, ingestion pipeline
      users/                User storage and encrypted GitHub token access
  frontend/                 Next.js app
    src/
      app/                  App Router pages and layouts
      components/           UI, dashboard, repo, commit, release, chart components
      lib/                  API helpers, types, formatting, config
  docker-compose.yml        Local PostgreSQL + Redis services
  dev.ps1                   Windows development startup helper
  dev.sh                    Unix-style development startup helper
```

## How The App Works

```text
User
  -> signs in with GitHub
  -> connects a repository
  -> backend verifies the repo with GitHub
  -> backend queues a sync job
  -> worker fetches commits, diffs, and releases
  -> AI summarizes and categorizes changes
  -> PostgreSQL stores repo, commit, release, and embedding data
  -> frontend shows commits, release notes, search, and analytics
```

Important flow:

1. The user signs in through `GET /auth/github`.
2. GitHub redirects back to `GET /auth/github/callback`.
3. The backend stores/updates the user and encrypts the GitHub access token.
4. The backend creates a JWT and sets it as an httpOnly `token` cookie.
5. The dashboard reads protected data using that cookie.
6. When a repo is connected, the backend creates a repo record and queues a Bull job.
7. The job syncs commits/releases and stores AI-enriched results.
8. The frontend polls repo status while sync is running.

## Backend Overview

The backend is a NestJS app. It is organized by feature modules:

| Module | Responsibility |
|---|---|
| `AuthModule` | GitHub OAuth, JWT cookie auth, logout, current user |
| `UsersModule` | User lookup, upsert, encrypted GitHub access token storage |
| `ReposModule` | Connect/list/delete repos, queue sync, get status, GitHub API client |
| `JobsModule` | Bull queue setup and repo sync processor |
| `AiModule` | Diff summaries, categories, changelog entries, release summaries, embeddings |
| `CommitsModule` | Commit list/detail/filtering and semantic search |
| `ReleasesModule` | Release list and release detail lookup |
| `AnalyticsModule` | SQL aggregation for dashboard charts |

The backend entry point is `backend/src/main.ts`. It sets up:

- schema bootstrap for PostgreSQL tables and pgvector
- cookie parsing
- GitHub OAuth session state support
- CORS for the frontend URL
- Swagger in development/local mode
- rate limiting
- CSRF origin/referer checks for mutating requests
- global DTO validation
- global exception filtering

## Database Tables

The app uses PostgreSQL. Tables are created by `ensureSchema()` in `backend/src/main.ts`.

| Table | Purpose |
|---|---|
| `users` | GitHub user profile and encrypted GitHub access token |
| `repos` | Connected repositories and sync status |
| `commits` | Raw commit metadata plus AI summary/category/changelog |
| `commit_embeddings` | pgvector embeddings for semantic search |
| `releases` | GitHub releases plus AI summaries and grouped change arrays |
| `release_commits` | Many-to-many link between releases and commits |

Commit SHA uniqueness is scoped by repository using `repo_id + sha`, because the same commit SHA can exist across different repositories.

## API Overview

Most routes are protected with JWT cookie auth. The main endpoints are:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Backend health check |
| `GET` | `/auth/github` | Start GitHub OAuth |
| `GET` | `/auth/github/callback` | Finish OAuth, set cookie, redirect |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/auth/logout` | Clear auth cookie |
| `POST` | `/repos` | Connect a repository |
| `GET` | `/repos` | List connected repositories |
| `GET` | `/repos/:id` | Get one repository |
| `DELETE` | `/repos/:id` | Remove a repository |
| `POST` | `/repos/:id/sync` | Queue a repository sync |
| `GET` | `/repos/:id/status` | Get sync status and progress |
| `GET` | `/repos/:repoId/commits` | List commits with filters |
| `GET` | `/repos/:repoId/commits/:sha` | Get one commit |
| `POST` | `/repos/:repoId/commits/search` | Semantic commit search |
| `GET` | `/repos/:repoId/releases` | List releases |
| `GET` | `/repos/:repoId/releases/tag/:tagName` | Get release by tag |
| `GET` | `/repos/:repoId/analytics` | Get commit analytics |

In development/local mode, Swagger is available at:

```text
http://localhost:3001/api
```

## Prerequisites

- Node.js LTS
- npm
- Docker Desktop or Docker Engine
- GitHub OAuth App
- Gemini API key
- Kilo Code API key

## GitHub OAuth Setup

Create a GitHub OAuth App with:

```text
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3001/auth/github/callback
```

The backend currently requests these scopes:

```text
user:email
repo
```

The `repo` scope is broad, but classic GitHub OAuth does not provide a private-repository read-only scope. A GitHub App or fine-grained token flow would be a better production option.

## Environment Variables

Create these files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

### Backend `.env`

Required backend variables:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=changelog_db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_64_char_hex_jwt_secret_here
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_64_char_hex_session_secret_here
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here

GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

GEMINI_API_KEY=your_gemini_api_key
KILOCODE_API_KEY=your_kilo_code_key
KILOCODE_MODEL=nvidia/nemotron-3-super-120b-a12b:free

FRONTEND_URL=http://localhost:3000
```

Generate secrets with:

```bash
openssl rand -hex 32
```

`ENCRYPTION_KEY` must be exactly 64 hex characters because it is used as a 32-byte AES-256-GCM key.

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
```

`NEXT_PUBLIC_API_URL` is used by browser-side Axios calls. `BACKEND_URL` is used by server-side Next.js fetch helpers.

## Installation

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running Locally

From the repository root, start PostgreSQL and Redis:

```bash
docker compose up -d
```

Start the backend:

```bash
cd backend
npm run start:dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001
Swagger:  http://localhost:3001/api
```

## Development Helper Scripts

This repo also includes startup helpers.

Windows PowerShell:

```powershell
.\dev.ps1
```

Unix-style shell:

```bash
./dev.sh
```

The helpers start Docker services, backend, frontend, and write logs to `.dev-logs/`.

Useful PowerShell preflight:

```powershell
.\dev.ps1 -CheckOnly
```

Start and stop after both services become ready:

```powershell
.\dev.ps1 -ExitAfterReady
```

## Common Development Commands

Backend:

```bash
cd backend
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

## Security Notes

- Auth uses GitHub OAuth.
- The backend stores the app session as a JWT in an httpOnly cookie.
- The GitHub access token is encrypted before being saved in the database.
- Cookie-based auth is protected with SameSite cookies and Origin/Referer checks for mutating requests.
- CORS allows only the configured frontend origin.
- Helmet adds common security headers on the backend.
- The frontend adds basic security response headers through Next.js config.
- Swagger is disabled outside development/local mode.
- The global exception filter avoids returning raw server stack traces for unexpected errors.

## Sync Behavior

Repository sync is intentionally asynchronous:

1. The API validates and stores the repository.
2. A Bull job is queued in Redis.
3. The worker fetches GitHub commits and releases.
4. AI providers summarize, categorize, and embed commit data.
5. PostgreSQL stores the results.
6. The repo status becomes `ready` or `error`.

If the browser is closed during sync, the backend job continues as long as the backend, Redis, and PostgreSQL are still running. If the whole dev stack is stopped, the sync may be interrupted. Running sync again should generally continue by skipping complete commits and reprocessing incomplete AI fields.

## Troubleshooting

### Backend fails on startup

Check that:

- `backend/.env` exists
- `JWT_SECRET` is at least 32 characters
- `ENCRYPTION_KEY` is 64 hex characters
- PostgreSQL and Redis are running
- `DB_*` and `REDIS_*` values match your local ports

### GitHub login fails

Check that:

- GitHub OAuth callback URL is exactly `http://localhost:3001/auth/github/callback`
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- `FRONTEND_URL=http://localhost:3000`

### Repo sync stays pending or syncing

Check backend logs in `.dev-logs/backend.log` or the backend terminal. Common causes are:

- GitHub token expired or revoked
- GitHub API rate limit
- missing AI provider key
- Redis not running
- backend stopped during the job

### Dashboard progress looks stale

The frontend polls `/repos/:id/status` while a repo is `pending` or `syncing`. If the backend has finished but the dashboard looks old, refresh the dashboard or open the repo page to force a fresh server fetch. The dashboard also auto-resumes polling for in-flight repos.

## Known Limitations

- Sync currently fetches the latest 100 commits per repository.
- Semantic search uses brute-force pgvector distance because the Gemini embedding dimension is 3072.
- There are no production-grade TypeORM migrations yet; schema bootstrap is handled in `backend/src/main.ts`.
- AI output can vary and should be reviewed before using it as official release communication.
- Classic GitHub OAuth requires the broad `repo` scope for private repository access.

```

## License

This repository includes a `LICENSE` file. Review it before reusing or distributing the project.
