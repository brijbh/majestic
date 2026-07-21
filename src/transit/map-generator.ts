import { classifyBranch } from "./branch-classifier";
import type {
  RepositoryPullRequest,
  RepositorySnapshot,
  TransitEvent,
  TransitLine,
  TransitMapModel,
  TransitStage,
  TransitStation,
  TransitTrain,
  TransitTrainStatus,
} from "./model";

const stageOrder: TransitStage[] = [
  "start",
  "development",
  "pull-request",
  "review",
  "checks",
  "merge",
  "release",
  "deploy",
];

const stationLabels: Record<TransitStage, string> = {
  start: "Start",
  development: "Development",
  "pull-request": "Pull Request",
  review: "Review",
  checks: "Checks",
  merge: "Merge",
  release: "Release",
  deploy: "Deploy",
};

const lines: TransitLine[] = [
  { id: "main", label: "Main", color: "#61dafb", y: 0.2 },
  { id: "feature", label: "Feature", color: "#7ee787", y: 0.34 },
  { id: "development", label: "Development", color: "#d2a8ff", y: 0.48 },
  { id: "release", label: "Release", color: "#ffa657", y: 0.62 },
  { id: "hotfix", label: "Hotfix", color: "#ff7b72", y: 0.76 },
  { id: "other", label: "Other", color: "#a5d6ff", y: 0.9 },
];

export function generateTransitMap(snapshot: RepositorySnapshot): TransitMapModel {
  const stations: TransitStation[] = stageOrder.map((stage, index) => ({
    id: stage,
    label: stationLabels[stage],
    x: index / (stageOrder.length - 1),
  }));

  const trains = [
    ...snapshot.pullRequests.slice(0, 12).map(prToTrain),
    ...snapshot.releases.slice(0, 2).map((release) => ({
      id: `release-${release.id}`,
      label: release.name || release.tagName,
      line: "release" as const,
      stage: "release" as const,
      progress: stageProgress("release"),
      status: "released" as const,
      branch: snapshot.repository.defaultBranch,
      author: "release",
      commitCount: 0,
      url: release.url,
      updatedAt: release.publishedAt,
    })),
    ...snapshot.deployments.slice(0, 2).map((deployment) => ({
      id: `deployment-${deployment.id}`,
      label: deployment.environment,
      line: classifyBranch(deployment.branch),
      stage: "deploy" as const,
      progress: stageProgress("deploy"),
      status:
        deployment.state === "success"
          ? ("deployed" as const)
          : deployment.state === "failed"
            ? ("failed" as const)
            : ("waiting" as const),
      branch: deployment.branch,
      author: "deployment",
      commitCount: 0,
      updatedAt: deployment.updatedAt,
    })),
  ];

  const events = buildEvents(snapshot, trains);
  return { lines, stations, trains, events };
}

function prToTrain(pr: RepositoryPullRequest): TransitTrain {
  const stage =
    pr.state === "merged"
      ? "merge"
      : pr.reviewState === "pending"
        ? "review"
        : "checks";
  return {
    id: `pr-${pr.number}`,
    label: `#${pr.number} ${pr.title}`,
    line: classifyBranch(pr.branch),
    stage,
    progress: stageProgress(stage),
    status: prStatus(pr),
    branch: pr.branch,
    author: pr.author,
    commitCount: pr.commitCount,
    pullRequestNumber: pr.number,
    url: pr.url,
    updatedAt: pr.updatedAt,
  };
}

function prStatus(pr: RepositoryPullRequest): TransitTrainStatus {
  if (pr.state === "merged") return "merged";
  if (pr.reviewState === "approved" && pr.checkState === "success") return "approved";
  if (pr.checkState === "failed") return "failed";
  if (pr.reviewState === "changes-requested") return "blocked";
  return "moving";
}

function stageProgress(stage: TransitStage): number {
  return stageOrder.indexOf(stage) / (stageOrder.length - 1);
}

function buildEvents(
  snapshot: RepositorySnapshot,
  trains: TransitTrain[],
): TransitEvent[] {
  const prEvents = trains.map((train) => ({
    id: `event-${train.id}`,
    title:
      train.status === "failed"
        ? "Check failed"
        : train.status === "approved"
          ? "Pull request approved"
          : train.status === "merged"
            ? "Merged at junction"
            : "Workstream moving",
    detail: train.label,
    stage: train.stage,
    line: train.line,
    status: train.status,
    occurredAt: train.updatedAt,
  }));

  const commitEvents = snapshot.commits.slice(0, 8).map((commit) => ({
    id: `commit-${commit.id}`,
    title: "Commit pushed",
    detail: commit.message,
    stage: "development" as const,
    line: classifyBranch(commit.branch),
    status: "moving" as const,
    occurredAt: commit.committedAt,
  }));

  return [...prEvents, ...commitEvents]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 16);
}
