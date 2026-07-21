import { describe, expect, it } from "vitest";
import { demoSnapshot } from "../demo/demo-snapshot";
import { generateTransitMap } from "./map-generator";

describe("generateTransitMap", () => {
  it("creates deterministic transit IDs from the same snapshot", () => {
    const first = generateTransitMap(demoSnapshot);
    const second = generateTransitMap(demoSnapshot);
    expect(first.trains.map((train) => train.id)).toEqual(
      second.trains.map((train) => train.id),
    );
    expect(first.stations.map((station) => station.id)).toEqual([
      "start",
      "development",
      "pull-request",
      "review",
      "checks",
      "merge",
      "release",
      "deploy",
    ]);
  });

  it("keeps failed checks visible as failed trains", () => {
    const model = generateTransitMap(demoSnapshot);
    expect(model.trains.some((train) => train.status === "failed")).toBe(true);
  });
});
