export const DIFF_SUMMARY_PROMPT = `Summarize the following git diff in 1-3 sentences. Focus on WHAT changed functionally, not HOW the code changed. Be concise and technical.

Diff:
{diff}`;

export const CATEGORIZE_PROMPT = `Classify this commit into exactly one category. Respond with ONLY the category name, nothing else.

Categories:
- breaking: removes or changes existing behavior in a non-backward-compatible way
- feature: adds new functionality
- fix: fixes a bug or incorrect behavior
- chore: dependency updates, config, CI/CD, build tooling, version bumps
- docs: documentation changes only
- refactor: code restructure with no behavior change

Commit message: {message}
Diff summary: {diffSummary}`;

export const CHANGELOG_PROMPT = `Write a single changelog entry for this commit. Write it for developers reading a changelog. Be specific and start with a verb. Maximum 2 sentences. Do not start with "This commit".

Commit message: {message}
Files changed: {filesChanged}
Diff summary: {diffSummary}`;

export const RELEASE_SUMMARY_PROMPT = `Write a 3-4 sentence release summary for developers. Highlight the most important changes. Mention breaking changes prominently if any exist.

Release tag: {tagName}
Total commits: {totalCommits}

Commits by category:
Breaking changes: {breaking}
New features: {features}
Bug fixes: {fixes}
Other: {chores}`;
