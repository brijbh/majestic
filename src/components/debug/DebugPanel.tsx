import type { RepositorySnapshot, TransitMapModel } from "../../transit/model";

type Props = {
  snapshot?: RepositorySnapshot;
  model?: TransitMapModel;
  phase: string;
  error?: string;
};

export function DebugPanel({ snapshot, model, phase, error }: Props) {
  const enabled =
    new URLSearchParams(window.location.search).has("debug") ||
    window.localStorage.getItem("git-transit-debug") === "1";

  if (!enabled && !error) return null;

  const diagnostics = {
    phase,
    error,
    route: window.location.href,
    mode: snapshot ? "map" : "entry",
    repository: snapshot?.repository.fullName,
    fetchedAt: snapshot?.fetchedAt,
    counts: snapshot
      ? {
          branches: snapshot.branches.length,
          commits: snapshot.commits.length,
          pullRequests: snapshot.pullRequests.length,
          workflowRuns: snapshot.workflowRuns.length,
          releases: snapshot.releases.length,
          deployments: snapshot.deployments.length,
          warnings: snapshot.warnings.length,
          lines: model?.lines.length ?? 0,
          stations: model?.stations.length ?? 0,
          trains: model?.trains.length ?? 0,
          events: model?.events.length ?? 0,
        }
      : undefined,
    userAgent: navigator.userAgent,
  };

  return (
    <aside className="debug-panel" aria-label="Debug diagnostics">
      <strong>Git Transit Debug</strong>
      <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
    </aside>
  );
}
