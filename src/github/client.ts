import { z } from "zod";
import type { RepositoryRef, RepositorySnapshot } from "../transit/model";

const repoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  default_branch: z.string(),
  html_url: z.string(),
  stargazers_count: z.number(),
});

const prSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  html_url: z.string(),
  state: z.string(),
  user: z.object({ login: z.string() }).nullable(),
  head: z.object({ ref: z.string() }),
  created_at: z.string(),
  updated_at: z.string(),
  merged_at: z.string().nullable().optional(),
});

const branchSchema = z.object({
  name: z.string(),
  protected: z.boolean().default(false),
});

const commitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    message: z.string(),
    author: z.object({ name: z.string(), date: z.string() }).nullable(),
  }),
});

const releaseSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  tag_name: z.string(),
  html_url: z.string(),
  published_at: z.string().nullable(),
});

const workflowSchema = z.object({
  workflow_runs: z.array(
    z.object({
      id: z.number(),
      name: z.string().nullable(),
      head_branch: z.string().nullable(),
      status: z.string().nullable(),
      conclusion: z.string().nullable(),
      updated_at: z.string(),
    }),
  ),
});

export async function fetchRepositorySnapshot(
  ref: RepositoryRef,
): Promise<RepositorySnapshot> {
  const base = `https://api.github.com/repos/${ref.owner}/${ref.name}`;
  const fetchedAt = new Date().toISOString();
  const [repo, branches, commits, prs, releases, workflows] = await Promise.all([
    fetchRequired(base, repoSchema),
    fetchOptional(`${base}/branches?per_page=8`, z.array(branchSchema), []),
    fetchOptional(`${base}/commits?per_page=40`, z.array(commitSchema), []),
    fetchOptional(
      `${base}/pulls?state=all&sort=updated&direction=desc&per_page=12`,
      z.array(prSchema),
      [],
    ),
    fetchOptional(`${base}/releases?per_page=5`, z.array(releaseSchema), []),
    fetchOptional(`${base}/actions/runs?per_page=10`, workflowSchema, {
      workflow_runs: [],
    }),
  ]);

  return {
    repository: {
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ?? "Public GitHub repository",
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      stars: repo.stargazers_count,
    },
    branches: branches.value.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      updatedAt: fetchedAt,
    })),
    commits: commits.value.map((commit) => ({
      id: commit.sha,
      message: commit.commit.message.split("\n")[0] || "Commit",
      author: commit.commit.author?.name ?? "Unknown",
      branch: repo.default_branch,
      committedAt: commit.commit.author?.date ?? fetchedAt,
    })),
    pullRequests: prs.value.map((pr) => ({
      id: String(pr.id),
      number: pr.number,
      title: pr.title,
      branch: pr.head.ref,
      author: pr.user?.login ?? "unknown",
      state: pr.merged_at ? "merged" : pr.state === "open" ? "open" : "closed",
      reviewState: "unknown",
      checkState: "unknown",
      commitCount: 0,
      url: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    })),
    workflowRuns: workflows.value.workflow_runs.map((run) => ({
      id: String(run.id),
      name: run.name ?? "Workflow",
      status:
        run.conclusion === "success"
          ? "success"
          : run.conclusion === "failure"
            ? "failed"
            : run.status === "in_progress"
              ? "in-progress"
              : run.status === "queued"
                ? "queued"
                : "unknown",
      branch: run.head_branch ?? repo.default_branch,
      updatedAt: run.updated_at,
    })),
    releases: releases.value.map((release) => ({
      id: String(release.id),
      name: release.name ?? release.tag_name,
      tagName: release.tag_name,
      url: release.html_url,
      publishedAt: release.published_at ?? fetchedAt,
    })),
    deployments: [],
    contributors: [],
    fetchedAt,
    warnings: [
      ...branches.warnings,
      ...commits.warnings,
      ...prs.warnings,
      ...releases.warnings,
      ...workflows.warnings,
    ],
  };
}

async function fetchRequired<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "This repository could not be accessed publicly."
          : response.status === 403
            ? "GitHub's public API limit has been reached. Try again later or view the bundled demo."
            : "GitHub could not return that repository right now.",
      );
    }
    return schema.parse(await response.json());
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchOptional<T>(
  url: string,
  schema: z.ZodSchema<T>,
  fallback: T,
): Promise<{ value: T; warnings: { code: string; message: string }[] }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      return {
        value: fallback,
        warnings: [{ code: String(response.status), message: `${url} unavailable` }],
      };
    }
    return { value: schema.parse(await response.json()), warnings: [] };
  } catch {
    return {
      value: fallback,
      warnings: [{ code: "network", message: `${url} unavailable` }],
    };
  } finally {
    window.clearTimeout(timer);
  }
}
