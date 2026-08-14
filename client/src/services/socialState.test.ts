import { describe, expect, it } from "vitest";
import { socialEmptyStateCopy, socialRelationLabel } from "./socialState";

describe("social profile state", () => {
  it("keeps friendship states distinct from room membership", () => {
    expect(socialRelationLabel("friend")).toBe("Friend");
    expect(socialEmptyStateCopy("friends")).toContain("independent from rooms");
  });

  it("explains the safety impact of blocking", () => {
    expect(socialEmptyStateCopy("blocked")).toContain("cannot view your profile");
  });
});
