import { describe, expect, it } from "vitest";
import { formatGroupFlightClock, getGroupFlightRemainingSeconds, groupFlightStatusCopy } from "./groupFlightState";

describe("groupFlightState", () => {
  it("uses clear all-members lifecycle copy without claiming solo credit", () => {
    expect(groupFlightStatusCopy("boarding").description).toContain("Every room member");
    expect(groupFlightStatusCopy("completed").description).toContain("separately");
    expect(groupFlightStatusCopy("abandoned").label).toBe("Flight closed");
  });

  it("never reports negative shared timer values", () => {
    expect(getGroupFlightRemainingSeconds(1500, 400)).toBe(1100);
    expect(getGroupFlightRemainingSeconds(1500, 1600)).toBe(0);
    expect(formatGroupFlightClock(3661)).toBe("1:01:01");
  });
});
