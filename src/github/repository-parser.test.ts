import { describe, expect, it } from "vitest";
import { parseRepositoryInput } from "./repository-parser";

describe("parseRepositoryInput", () => {
  it.each([
    ["facebook/react", { owner: "facebook", name: "react" }],
    ["https://github.com/facebook/react", { owner: "facebook", name: "react" }],
    ["https://github.com/facebook/react/", { owner: "facebook", name: "react" }],
    ["http://github.com/facebook/react", { owner: "facebook", name: "react" }],
    ["github.com/facebook/react", { owner: "facebook", name: "react" }],
  ])("normalizes %s", (input, expected) => {
    expect(parseRepositoryInput(input)).toEqual(expected);
  });

  it.each([
    "",
    "github.com/facebook/react/pulls/1",
    "https://gitlab.com/facebook/react",
    "facebook",
    "facebook/react/issues/1",
  ])("rejects %s", (input) => {
    expect(() => parseRepositoryInput(input)).toThrow();
  });
});
