import { describe, expect, it } from "vitest";
import { canonicalForPath, seoForPath } from "./seo";

describe("Waypoint SEO routing", () => {
  it("keeps the revised About page indexable with an accurate virtual-focus description", () => {
    const metadata = seoForPath("/about/");

    expect(metadata.indexable).toBe(true);
    expect(metadata.title).toBe("About Waypoint — A Virtual Focus Timer");
    expect(metadata.description).toContain("virtual flights");
  });

  it("marks private account, room, feedback, and pilot routes as non-indexable", () => {
    expect(seoForPath("/journey").indexable).toBe(false);
    expect(seoForPath("/cofocus").indexable).toBe(false);
    expect(seoForPath("/feedback").indexable).toBe(false);
    expect(seoForPath("/u/night-pilot").indexable).toBe(false);
  });

  it("gives original guide routes distinct metadata and content-supported FAQ markup", () => {
    const seo = seoForPath("/guides/pomodoro-timer");
    expect(seo.indexable).toBe(true);
    expect(seo.title).toContain("Pomodoro timer");
    expect(Array.isArray(seo.structuredData)).toBe(true);
  });

  it("uses the production domain and normalizes trailing slashes for canonicals", () => {
    expect(canonicalForPath("/about/")).toBe("https://focus-flight-timer.vercel.app/about");
  });

  it("does not accidentally index an unknown route", () => {
    expect(seoForPath("/not-a-waypoint-page").indexable).toBe(false);
  });
});
