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
  address?: { city?: string; town?: string; village?: string; country?: string; country_code?: string };
};

export async function geocodePlace(query: string): Promise<Destination[]> {
  const url = new URL(MAP_CONFIG.nominatimUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Geocoding service is unavailable.");
  const results = (await response.json()) as NominatimResult[];
  return results
    .map((result) => {
      const city = result.address?.city || result.address?.town || result.address?.village || result.name || result.display_name.split(",")[0];
      return {
        id: `geocode-${result.place_id}`,
        name: result.name || city,
        city,
        country: result.address?.country || "",
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
        displayName: result.display_name,
      } satisfies Destination;
    })
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}
