export type RepositoryRef = {
  owner: string;
  name: string;
};

export type ThemeName = "metro" | "retro";

export type TransitLineKind =
  "main" | "feature" | "development" | "release" | "hotfix" | "other";

export type TransitStage =
  | "start"
  | "development"
  | "pull-request"
  | "review"
  | "checks"
  | "merge"
  | "release"
  | "deploy";

export type TransitTrainStatus =
  | "moving"
  | "waiting"
  | "approved"
  | "blocked"
  | "failed"
  | "merged"
  | "released"
  | "deployed";

export type RepositorySummary = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  url: string;
  stars: number;
};

export type RepositoryBranch = {
  name: string;
  protected: boolean;
  updatedAt: string;
};

export type RepositoryCommit = {
  id: string;
  message: string;
  author: string;
  branch: string;
  committedAt: string;
};

export type RepositoryPullRequest = {
  id: string;
  number: number;
  title: string;
  branch: string;
  author: string;
  state: "open" | "closed" | "merged";
  reviewState: "pending" | "approved" | "changes-requested" | "unknown";
  checkState: "pending" | "success" | "failed" | "unknown";
  commitCount: number;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type RepositoryWorkflowRun = {
  id: string;
  name: string;
  status: "queued" | "in-progress" | "success" | "failed" | "unknown";
  branch: string;
  updatedAt: string;
};

export type RepositoryRelease = {
  id: string;
  name: string;
  tagName: string;
  url: string;
  publishedAt: string;
};

export type RepositoryDeployment = {
  id: string;
  environment: string;
  state: "success" | "pending" | "failed" | "unknown";
  branch: string;
  updatedAt: string;
};

export type RepositoryContributor = {
  id: string;
  name: string;
  avatarUrl?: string;
  contributions: number;
};

export type DataWarning = {
  code: string;
  message: string;
};

export type RepositorySnapshot = {
  repository: RepositorySummary;
  branches: RepositoryBranch[];
  commits: RepositoryCommit[];
  pullRequests: RepositoryPullRequest[];
  workflowRuns: RepositoryWorkflowRun[];
  releases: RepositoryRelease[];
  deployments: RepositoryDeployment[];
  contributors: RepositoryContributor[];
  fetchedAt: string;
  warnings: DataWarning[];
};

export type TransitLine = {
  id: TransitLineKind;
  label: string;
  color: string;
  y: number;
};

export type TransitStation = {
  id: TransitStage;
  label: string;
  x: number;
};

export type TransitTrain = {
  id: string;
  label: string;
  line: TransitLineKind;
  stage: TransitStage;
  progress: number;
  status: TransitTrainStatus;
  branch: string;
  author: string;
  commitCount: number;
  pullRequestNumber?: number;
  url?: string;
  updatedAt: string;
};

export type TransitEvent = {
  id: string;
  title: string;
  detail: string;
  stage: TransitStage;
  line: TransitLineKind;
  status: TransitTrainStatus;
  occurredAt: string;
};

export type TransitMapModel = {
  lines: TransitLine[];
  stations: TransitStation[];
  trains: TransitTrain[];
  events: TransitEvent[];
};
