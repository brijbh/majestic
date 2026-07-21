# GitHub Data Model

The client uses public GitHub API endpoints for repository metadata, branches, recent commits, pull requests, releases, and workflow runs.

Initial request limits are conservative: up to 8 branches, 40 commits, 12 pull requests, 5 releases, and 10 workflow runs.

Responses are validated with Zod and transformed into normalized repository snapshots. Optional endpoint failures are represented as warnings so the map can render partial data. Rate-limit and inaccessible repository states produce user-facing errors.

V1 does not request a GitHub token.

An optional fine-grained read-only GitHub token can be stored locally by the user. When present, the browser includes it as a Bearer token in direct GitHub API requests. This reduces unauthenticated rate-limit failures and may allow repository owners to view activity for repositories their token can read.
