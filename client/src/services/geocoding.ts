/* Cloud Atlas Editorial geocoding: Nominatim is a fallback for city/place queries not found locally. */

import { MAP_CONFIG } from "@/config/map";
import type { Destination } from "@/services/airportSearch";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  name?: string;
  namedetails?: Record<string, string>;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
    "city:en"?: string;
    "town:en"?: string;
    "village:en"?: string;
    "country:en"?: string;
  };
};

export async function geocodePlace(query: string): Promise<Destination[]> {
  const url = new URL(MAP_CONFIG.nominatimUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("accept-language", "en");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Geocoding service is unavailable.");
  const results = (await response.json()) as NominatimResult[];
  return results
    .map((result) => {
      const englishName = result.namedetails?.["name:en"] || result.namedetails?.["official_name:en"] || result.name;
      const city = result.address?.["city:en"] || result.address?.["town:en"] || result.address?.["village:en"] || result.address?.city || result.address?.town || result.address?.village || englishName || result.display_name.split(",")[0];
      const country = result.address?.["country:en"] || result.address?.country || "";
      return {
        id: `geocode-${result.place_id}`,
        name: englishName || city,
        city,
        country,
        countryCode: (result.address?.country_code || "").toUpperCase(),
        iata: null,
        icao: null,
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        type: result.type || "place",
        scheduledService: false,
        isMajor: false,
        priority: 20,
        source: "geocoder" as const,
        displayName: [englishName || city, country].filter(Boolean).join(", "),
      } satisfies Destination;
    })
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}
