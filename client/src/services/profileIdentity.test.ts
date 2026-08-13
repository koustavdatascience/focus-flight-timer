import { describe, expect, it } from "vitest";
import { getHandleIssue, normalizeHandle } from "./profileIdentity";

describe("profile identity helpers", () => {
  it("normalizes public handles before persistence", () => {
    expect(normalizeHandle("  Sky_Pilot  ")).toBe("sky_pilot");
  });

  it("accepts canonical handles and rejects unsafe or malformed values", () => {
    expect(getHandleIssue("sky_pilot")).toBeNull();
    expect(getHandleIssue("No Spaces")).toContain("lowercase");
    expect(getHandleIssue("ab")).toContain("3–20");
  });
});
