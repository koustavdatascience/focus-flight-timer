import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const legalPage = readFileSync(
  resolve(process.cwd(), "client", "src", "pages", "Legal.tsx"),
  "utf8",
);

describe("Waypoint legal working drafts", () => {
  it("keeps the supplied privacy-policy structure and published contact", () => {
    expect(legalPage).toContain("1. Information collection");
    expect(legalPage).toContain("5. Retention and deletion");
    expect(legalPage).toContain("koustavdatascience@gmail.com");
    expect(legalPage).toContain("not stored by Waypoint in readable form");
  });

  it("keeps the terms accurate to the currently free virtual-focus service", () => {
    expect(legalPage).toContain("1. Service description");
    expect(legalPage).toContain("paid services are not currently offered");
    expect(legalPage).toContain("not a flight booking, navigation, aviation, or real-world travel service");
    expect(legalPage).not.toContain("We provide both free and paid services");
  });

  it("retains explicit attorney-review and unfinished-jurisdiction framing", () => {
    expect(legalPage).toContain("qualified legal counsel");
    expect(legalPage).toContain("have not yet been established");
  });
});
