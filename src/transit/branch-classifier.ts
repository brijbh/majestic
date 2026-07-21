import type { TransitLineKind } from "./model";

export function classifyBranch(branch: string): TransitLineKind {
  const normalized = branch.trim().toLowerCase();
  if (["main", "master", "trunk"].includes(normalized)) return "main";
  if (normalized === "develop" || normalized === "development") return "development";
  if (normalized.startsWith("feature/") || normalized.startsWith("feat/"))
    return "feature";
  if (normalized.startsWith("release/")) return "release";
  if (
    normalized.startsWith("hotfix/") ||
    normalized.startsWith("fix/") ||
    normalized.startsWith("bugfix/")
  )
    return "hotfix";
  return "other";
}
