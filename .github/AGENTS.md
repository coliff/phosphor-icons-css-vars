# Agents

<!-- https://agents.md -->

## GitHub Actions Workflows

- Always use the latest version
- YML files should begin with --- on the first line.
- All GitHub Actions should use SHA-1 pinned versions.
- All should be formatted with Prettier.
- If using `actions/checkout`, it should have `persist-credentials: false` set.
- Use least-privilege `permissions`: set `contents: read` (or `{}`) at the workflow level and grant write scopes only on the jobs that need them.
- Use `npm install --ignore-scripts` in workflows.
- GitHub Actions should have a cooldown period of 7 days.

## Dependabot

- GitHub Actions updates should be grouped and updated monthly.
- npm packages should be grouped and updated monthly.
- Limit number of Dependabot PRs to be open to 2.
- Dependabot config should be formatted with Prettier.
- Dependencies should have a cooldown period of 7 days
