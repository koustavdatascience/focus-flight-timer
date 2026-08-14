import { describe, expect, it } from "vitest";
import { validateFeedbackMessage } from "./feedback";

describe("validateFeedbackMessage", () => {
  it("requires useful feedback", () => expect(validateFeedbackMessage("too short")).toContain("at least 10"));
  it("accepts a bounded, specific note", () => expect(validateFeedbackMessage("The route selector did not keep my airport.")).toBeNull());
  it("rejects oversized submissions", () => expect(validateFeedbackMessage("a".repeat(5001))).toContain("5,000"));
});
