# Architecture

Git Transit is a static Vite React application.

React owns application state, repository entry, top controls, panels, and textual accessibility views. Zustand persists only non-sensitive preferences. PixiJS owns the animated map surface and redraws tracks, stations, trains, and theme-specific scenery without high-frequency React state.

Data flow:

```text
GitHub API response
GitHub adapter
Normalized repository snapshot
Transit map model
PixiJS renderer
```

Browser storage is limited to last repository, theme, speed, and reduced-motion preference.
