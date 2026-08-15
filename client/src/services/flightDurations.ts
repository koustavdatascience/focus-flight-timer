import { supabase } from "@/lib/supabase";
import type { Destination } from "@/services/airportSearch";
import { distanceBetween } from "@/services/route";

export type FlightDurationSource = "verified_direct" | "estimated";

export type FlightDuration = {
  routeKey: string;
  durationSeconds: number;
  source: FlightDurationSource;
  sourceLabel: string;
  sourceUrl: string | null;
  isDirect: boolean;
};

export type RandomRouteRecommendation = {
  destination: Destination;
  duration: FlightDuration;
  distanceKm: number;
  durationDifferenceSeconds: number;
  candidateCount: number;
};

export type RandomOriginRouteRecommendation = RandomRouteRecommendation & {
  origin: Destination;
};

type CachedFlightDurationRow = {
  route_key: string;
  duration_seconds: number;
  source_type: FlightDurationSource;
  source_label: string;
  source_url: string | null;
  direct_flight: boolean;
  expires_at: string | null;
};

const LOCAL_CACHE_PREFIX = "focusflight:flight-duration:";
const ESTIMATED_CRUISE_SPEED_KPH = 800;
const SCHEDULE_ALLOWANCE_MINUTES = 35;

// Verified direct-route durations captured from FlightsFrom schedule pages on 2026-08-13.
// These fallback records mirror the database seed, so first-time visitors still receive sourced
// durations if their connection cannot read the shared cache. Source pages are listed per route.
const BOOTSTRAP_DIRECT_DURATIONS: Record<string, FlightDuration> = {
  "CCU-DEL": {
    routeKey: "CCU-DEL",
    durationSeconds: 2 * 60 * 60 + 45 * 60,
    source: "verified_direct",
    sourceLabel: "Direct schedule duration · FlightsFrom",
    sourceUrl: "https://www.flightsfrom.com/CCU-DEL",
    isDirect: true,
  },
  "DEL-BOM": {
    routeKey: "DEL-BOM",
    durationSeconds: 2 * 60 * 60 + 35 * 60,
    source: "verified_direct",
    sourceLabel: "Direct schedule duration · FlightsFrom",
    sourceUrl: "https://www.flightsfrom.com/DEL-BOM",
    isDirect: true,
  },
  "JFK-LAX": {
    routeKey: "JFK-LAX",
    durationSeconds: 6 * 60 * 60 + 36 * 60,
    source: "verified_direct",
    sourceLabel: "Direct schedule duration · FlightsFrom",
    sourceUrl: "https://www.flightsfrom.com/JFK-LAX",
    isDirect: true,
  },
};

export function getBootstrapFlightDuration(routeKey: string) {
  return BOOTSTRAP_DIRECT_DURATIONS[routeKey] ?? null;
}

function airportCode(airport: Destination) {
  return (airport.iata || airport.icao || String(airport.id)).trim().toUpperCase();
}

export function flightDurationRouteKey(origin: Destination, destination: Destination) {
  return `${airportCode(origin)}-${airportCode(destination)}`;
}

export function formatFlightDuration(durationSeconds: number) {
  const totalMinutes = Math.max(0, Math.round(durationSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes.toString().padStart(2, "0")}m` : `${minutes}m`;
}

export function formatFlightClock(durationSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((safeSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function estimateFlightDuration(distanceKm: number, routeKey = "estimated-route"): FlightDuration {
  const rawMinutes = (Math.max(0, distanceKm) / ESTIMATED_CRUISE_SPEED_KPH) * 60 + SCHEDULE_ALLOWANCE_MINUTES;
  const roundedMinutes = Math.max(35, Math.round(rawMinutes / 5) * 5);
  return {
    routeKey,
    durationSeconds: roundedMinutes * 60,
    source: "estimated",
    sourceLabel: `Estimated · ${ESTIMATED_CRUISE_SPEED_KPH} km/h typical cruise plus ${SCHEDULE_ALLOWANCE_MINUTES} min departure/arrival allowance`,
    sourceUrl: null,
    isDirect: false,
  };
}

/**
 * Chooses from airports with a transparent duration estimate closest to a focus-time
 * target. The selected route is still resolved by getFlightDuration afterwards so
 * shared or local direct-flight records take precedence whenever available.
 */
export function pickRandomDestinationForDuration(
  origin: Destination,
  targetDurationSeconds: number,
  airports: Destination[],
  random: () => number = Math.random,
): RandomRouteRecommendation | null {
  const target = Math.max(35 * 60, Math.round(targetDurationSeconds));
  const candidates = airports
    .filter((airport) => String(airport.id) !== String(origin.id) && airport.scheduledService && Boolean(airport.iata || airport.icao))
    .map((destination) => {
      const distanceKm = distanceBetween(origin, destination);
      const routeKey = flightDurationRouteKey(origin, destination);
      const duration = getBootstrapFlightDuration(routeKey) ?? estimateFlightDuration(distanceKm, routeKey);
      return {
        destination,
        duration,
        distanceKm,
        durationDifferenceSeconds: Math.abs(duration.durationSeconds - target),
      };
    })
    .sort((a, b) => a.durationDifferenceSeconds - b.durationDifferenceSeconds || b.destination.priority - a.destination.priority || a.destination.city.localeCompare(b.destination.city));

  const closest = candidates[0];
  if (!closest) return null;

  const closeWindowSeconds = Math.max(10 * 60, Math.round(target * 0.12));
  const shortList = candidates
    .filter((candidate) => candidate.durationDifferenceSeconds <= closest.durationDifferenceSeconds + closeWindowSeconds)
    .slice(0, 8);
  const safeRandom = Math.min(0.999999, Math.max(0, random()));
  const selected = shortList[Math.floor(safeRandom * shortList.length)] ?? closest;

  return {
    ...selected,
    candidateCount: shortList.length,
  };
}

/**
 * Selects a commercial airport for an unplanned first-use starting location.
 * It deliberately does not infer or reserve a destination; the traveller chooses
 * that next, and the duration matcher then operates from this selected origin.
 */
export function pickRandomOrigin(
  airports: Destination[],
  random: () => number = Math.random,
): Destination | null {
  const eligibleOrigins = airports.filter((airport) => airport.scheduledService && Boolean(airport.iata || airport.icao));
  if (!eligibleOrigins.length) return null;

  const safeRandom = Math.min(0.999999, Math.max(0, random()));
  return eligibleOrigins[Math.floor(safeRandom * eligibleOrigins.length)] ?? null;
}

/**
 * Picks a commercial starting airport first, then selects a duration-matched
 * destination from the same eligible catalogue. The caller may provide a
 * deterministic random function for tests.
 */
export function pickRandomOriginRouteForDuration(
  targetDurationSeconds: number,
  airports: Destination[],
  random: () => number = Math.random,
): RandomOriginRouteRecommendation | null {
  const eligibleOrigins = airports.filter((airport) => airport.scheduledService && Boolean(airport.iata || airport.icao));
  if (eligibleOrigins.length < 2) return null;

  const startIndex = Math.floor(Math.min(0.999999, Math.max(0, random())) * eligibleOrigins.length);
  for (let offset = 0; offset < eligibleOrigins.length; offset += 1) {
    const origin = eligibleOrigins[(startIndex + offset) % eligibleOrigins.length];
    const recommendation = pickRandomDestinationForDuration(origin, targetDurationSeconds, airports, random);
    if (recommendation) return { origin, ...recommendation };
  }
  return null;
}

function isFresh(row: CachedFlightDurationRow) {
  return !row.expires_at || new Date(row.expires_at).getTime() > Date.now();
}

function toDuration(row: CachedFlightDurationRow): FlightDuration {
  return {
    routeKey: row.route_key,
    durationSeconds: row.duration_seconds,
    source: row.source_type,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    isDirect: row.direct_flight,
  };
}

function getLocalDuration(routeKey: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${LOCAL_CACHE_PREFIX}${routeKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlightDuration;
    return typeof parsed.durationSeconds === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function saveLocalDuration(duration: FlightDuration) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${LOCAL_CACHE_PREFIX}${duration.routeKey}`, JSON.stringify(duration));
  } catch {
    // Duration lookup remains functional when private browsing or storage limits block caching.
  }
}

export async function getFlightDuration(origin: Destination, destination: Destination, distanceKm: number): Promise<FlightDuration> {
  const routeKey = flightDurationRouteKey(origin, destination);
  const local = getLocalDuration(routeKey);
  if (local) return local;

  try {
    const { data, error } = await supabase
      .from("flight_durations")
      .select("route_key, duration_seconds, source_type, source_label, source_url, direct_flight, expires_at")
      .eq("route_key", routeKey)
      .maybeSingle();
    if (!error && data && isFresh(data as CachedFlightDurationRow)) {
      const duration = toDuration(data as CachedFlightDurationRow);
      saveLocalDuration(duration);
      return duration;
    }
  } catch {
    // Use the bundled, source-attributed cache or a transparent estimate if the shared cache is unavailable.
  }

  const sourced = getBootstrapFlightDuration(routeKey);
  if (sourced) {
    saveLocalDuration(sourced);
    return sourced;
  }

  const estimate = estimateFlightDuration(distanceKm, routeKey);
  saveLocalDuration(estimate);
  return estimate;
}
