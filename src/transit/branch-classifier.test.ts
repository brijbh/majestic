import { describe, expect, it } from "vitest";
import { classifyBranch } from "./branch-classifier";

describe("classifyBranch", () => {
  it.each([
    ["main", "main"],
    ["master", "main"],
    ["feature/search", "feature"],
    ["feat/map", "feature"],
    ["develop", "development"],
    ["release/1.0", "release"],
    ["hotfix/login", "hotfix"],
    ["bugfix/checks", "hotfix"],
    ["experiment", "other"],
  ] as const)("maps %s to %s", (branch, line) => {
    expect(classifyBranch(branch)).toBe(line);
  });
});
