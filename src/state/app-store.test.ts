import { describe, expect, it } from "vitest";
import { useAppStore } from "./app-store";

describe("app store preferences", () => {
  it("updates theme and reduced motion preference", () => {
    useAppStore.getState().setTheme("retro");
    useAppStore.getState().setReducedMotion(true);
    expect(useAppStore.getState().theme).toBe("retro");
    expect(useAppStore.getState().reducedMotion).toBe(true);
  });
});
