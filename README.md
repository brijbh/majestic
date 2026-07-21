# Git Transit

Git Transit turns public GitHub repository activity into a living transit map. Branches become lines, pull requests become trains, commits become movement pulses, and releases or deployments become terminal arrivals.

Majestic is the internal project name for this V1 implementation.

## Why It Exists

Most repository activity views are tables or timelines. Git Transit is built for a large ambient display where a visitor can understand movement, blockers, and recent shipping activity within a few seconds.

## V1 Scope

- Repository entry screen accepting `owner/repository` or GitHub repository URLs.
- Bundled demo mode using fictional `signalworks/orbit-console` data.
- Metro and Retro visual themes.
- Animated PixiJS transit map with stations, lines, trains, signals, activity feed, and train inspector.
- Public GitHub repository fetching directly from the browser.
- Pause, speed, fullscreen, theme preference, and reduced-motion support.

## Privacy Model

Majestic does not use a custom backend, user accounts, telemetry, or a hosted database. Public repository information is requested directly from GitHub by the user's browser.

The app stores only non-sensitive local preferences such as the last repository, selected theme, animation speed, and reduced-motion preference.

## Supported Repository Format

Accepted examples:

```text
facebook/react
https://github.com/facebook/react
https://github.com/facebook/react/
http://github.com/facebook/react
github.com/facebook/react
```

Git Transit V1 supports public GitHub repositories. A token is optional and is intended for repository owners who want higher GitHub API limits or read-only access to repositories their token can view.

For repeated use, repository owners may optionally provide a fine-grained, read-only GitHub personal access token. The token is stored only in the browser's local storage and is sent directly to GitHub with API requests. It is not sent to Majestic infrastructure because V1 has no backend.

## Local Setup

```bash
cd C:\dev\majestic
pnpm install
pnpm dev
```

## Available Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
```

## Architecture Overview

The app is a static Vite React application. React owns forms, controls, panels, and accessibility text. PixiJS owns the animated canvas. GitHub API responses are fetched in `src/github/client.ts`, normalized into `RepositorySnapshot`, transformed by `src/transit/map-generator.ts`, and rendered by `src/renderer/TransitCanvas.tsx`.

## GitHub Data Processing

The browser requests repository metadata, branches, commits, pull requests, releases, and workflow runs from GitHub public APIs. Optional endpoint failures become warnings where possible so the map can still render partial activity.

Optional token setup:

1. Open GitHub Settings, then Developer settings.
2. Select Personal access tokens, then Fine-grained tokens.
3. Generate a new token with an expiration date.
4. Select the repository owner and only the repositories needed.
5. Use read-only repository permissions. Contents and metadata support basic activity. Add read-only Pull requests and Actions for richer PR and workflow data.
6. Copy the token once, paste it into Git Transit, and save it locally.

## Themes

Metro uses luminous curved tracks, dark grid spacing, circular stations, and smooth train silhouettes. Retro uses pixel-style tracks, block trains, tile-grid scenery, and a classic transport-management feel while using the same normalized data.

## Accessibility

The entry form is keyboard accessible, errors are textual, controls are semantic buttons, focus states are visible, reduced-motion is honored, and the activity feed plus train inspector provide a textual alternative to the canvas.

## Current Limitations

- V1 has no authentication and cannot access private repositories.
- GitHub unauthenticated API limits apply.
- Deployments are not exhaustively fetched yet.
- Mobile is intentionally basic; desktop and large displays are the target.

## Roadmap

- Add conditional GitHub request caching.
- Improve detailed PR review/check normalization within a conservative request budget.
- Add richer map replay scheduling.
- Add viewport visual QA snapshots.

## Contributing

Keep the project static, privacy-respecting, and focused on the transit-map experience. Do not add telemetry, accounts, a custom backend, or productivity scoring.

## Licence

MIT
