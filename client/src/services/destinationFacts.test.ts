import { describe, expect, it } from "vitest";
import { getDestinationBrief } from "./destinationFacts";
import type { Destination } from "./airportSearch";

const destination = (overrides: Partial<Destination> = {}): Destination => ({
  id: 1,
  name: "Sydney Kingsford Smith Airport",
  city: "Sydney",
  country: "Australia",
  countryCode: "AU",
  iata: "SYD",
  icao: "YSSY",
  latitude: -33.9461,
  longitude: 151.1772,
  type: "large_airport",
  scheduledService: true,
  isMajor: true,
  priority: 10,
  ...overrides,
});

describe("destination facts", () => {
  it("returns curated context for known airports", () => {
    const brief = getDestinationBrief(destination());
    expect(brief.title).toBe("Sydney");
    expect(brief.sourceLabel).toBe("Destination fact");
    expect(brief.fact).toContain("Sydney Harbour");
  });

  it("returns a transparent route note for unknown airports", () => {
    const brief = getDestinationBrief(destination({ iata: "ZZZ", city: "Example City", name: "Example Airport" }));
    expect(brief.sourceLabel).toBe("Route note");
    expect(brief.fact).toContain("Example City");
    expect(brief.fact).toContain("airport catalogue");
  });
});
