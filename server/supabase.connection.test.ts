import { describe, expect, it } from "vitest";

describe("Supabase browser configuration", () => {
  it("can reach the configured project Auth settings with the publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\//);
    expect(publishableKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey! },
    });

    expect(response.ok).toBe(true);
  }, 15_000);
});
