import { describe, expect, it } from "vitest";
import { groupSyncOfferCopy } from "./groupSyncOffers";

describe("groupSyncOfferCopy", () => {
  it("keeps pending sync clearly optional and separate from solo completion", () => {
    const copy = groupSyncOfferCopy("pending", "Bengaluru · BLR");
    expect(copy.title).toContain("Bengaluru");
    expect(copy.description).toContain("not recorded as a solo completion");
    expect(copy.action).toBe("Update solo location");
  });

  it("explains each non-actionable offer state", () => {
    expect(groupSyncOfferCopy("used", "BLR").action).toBeNull();
    expect(groupSyncOfferCopy("invalidated_by_new_solo_flight", "BLR").description).toContain("new solo flight");
    expect(groupSyncOfferCopy("unavailable_after_location_change", "BLR").description).toContain("changed");
  });
});
