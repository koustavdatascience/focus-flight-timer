/* Cloud Atlas Editorial airport search: data-driven records power cards, search results, and map markers. */

import airportData from "@/data/airports.json";

export type Destination = {
  id: number | string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  iata: string | null;
  icao: string | null;
  latitude: number;
  longitude: number;
  type: string;
  scheduledService: boolean;
  isMajor: boolean;
  priority: number;
  keywords?: string;
  source?: "airport" | "geocoder";
  displayName?: string;
};

export const AIRPORTS: Destination[] = (airportData as Destination[]).map((airport) => ({
  ...airport,
  source: "airport",
  displayName: airport.iata || airport.icao || airport.city,
}));

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getSearchScore(airport: Destination, query: string) {
  const normalizedQuery = normalize(query);
  const fields = [airport.iata, airport.icao, airport.name, airport.city, airport.country, airport.keywords]
    .filter(Boolean)
    .map((value) => normalize(String(value)));
  const exactCode = [airport.iata, airport.icao].some((value) => value && normalize(value) === normalizedQuery);
  const startsWithCode = [airport.iata, airport.icao].some((value) => value && normalize(value).startsWith(normalizedQuery));
  const exactName = fields.some((value) => value === normalizedQuery);
  const startsWithName = fields.some((value) => value.startsWith(normalizedQuery));
  const containsName = fields.some((value) => value.includes(normalizedQuery));

  if (exactCode) return 10000 + airport.priority;
  if (startsWithCode) return 8000 + airport.priority;
  if (exactName) return 6000 + airport.priority;
  if (startsWithName) return 4000 + airport.priority;
  if (containsName) return 2000 + airport.priority;
  return 0;
}

export function searchAirports(query: string, limit = 8) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  return AIRPORTS
    .map((airport) => ({ airport, score: getSearchScore(airport, normalizedQuery) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city))
    .slice(0, limit)
    .map((result) => result.airport);
}

export function getAirportByCode(code: string) {
  const normalizedCode = normalize(code);
  return AIRPORTS.find((airport) => airport.iata?.toLocaleLowerCase() === normalizedCode || airport.icao?.toLocaleLowerCase() === normalizedCode);
}

export function getAirportById(id: string | number) {
  return AIRPORTS.find((airport) => String(airport.id) === String(id));
}

export function getFeaturedAirports(codes: string[]) {
  return codes.map((code) => getAirportByCode(code)).filter((airport): airport is Destination => Boolean(airport));
}

export function findNearestAirport(latitude: number, longitude: number, maxDistanceKm = 250) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  let closest: { airport: Destination; distance: number } | undefined;

  for (const airport of AIRPORTS) {
    const deltaLat = toRadians(airport.latitude - latitude);
    const deltaLon = toRadians(airport.longitude - longitude);
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRadians(latitude)) * Math.cos(toRadians(airport.latitude)) * Math.sin(deltaLon / 2) ** 2;
    const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (distance <= maxDistanceKm && (!closest || distance < closest.distance)) {
      closest = { airport, distance };
    }
  }
  return closest?.airport;
}
