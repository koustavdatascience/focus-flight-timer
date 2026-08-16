import { describe, expect, it } from "vitest";
import { countWaypointPresence } from "./useWaypointPresence";

describe("countWaypointPresence", () => {
  it("counts anonymous live visitors and active flights", () => {
    expect(countWaypointPresence({
      one: [{ client_id: "visitor-a", status: "exploring" }],
      two: [{ client_id: "visitor-b", status: "flying" }],
    })).toEqual({ explorers: 2, flyers: 1 });
  });

  it("does not count one visitor twice when they have multiple tabs", () => {
    expect(countWaypointPresence({
      one: [{ client_id: "visitor-a", status: "exploring" }],
      two: [{ client_id: "visitor-a", status: "flying" }],
    })).toEqual({ explorers: 1, flyers: 1 });
  });
});
