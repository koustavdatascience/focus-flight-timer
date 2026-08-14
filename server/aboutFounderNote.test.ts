import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const aboutPage = readFileSync(
  resolve(process.cwd(), "client", "src", "pages", "About.tsx"),
  "utf8",
);

describe("Waypoint founder note", () => {
  it("keeps the user-provided personal project message on the About page", () => {
    expect(aboutPage).toContain("I built Waypoint because I was tired of timers that just sit there counting down at you.");
    expect(aboutPage).toContain("I&apos;m still figuring it out as I go, and I&apos;m keeping it small on purpose.");
    expect(aboutPage).toContain("I read every note.");
    expect(aboutPage).not.toContain("Waypoint began as a way to make a timer feel less like a countdown");
  });
});
