import type { Destination } from "@/services/airportSearch";
import tzLookup from "tz-lookup";

export type WaypointTicket = {
  tripCode: string;
  flightNumber: string;
  gate: string;
  seat: string;
  originCode: string;
  destinationCode: string;
  originCity: string;
  destinationCity: string;
  originTimezone: string;
  destinationTimezone: string;
  departureAt: string;
  arrivalAt: string;
  boardingAt: string;
  durationSeconds: number;
  issuedAt: string;
};

function airportCode(airport: Destination) {
  return (airport.iata || airport.icao || airport.city.slice(0, 3)).toUpperCase();
}

function randomToken(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let index = 0; index < values.length; index += 1) token += alphabet[values[index] % alphabet.length];
    return token;
  }
  for (let index = 0; index < length; index += 1) token += alphabet[Math.floor(Math.random() * alphabet.length)];
  return token;
}

function timezoneLabel(timeZone: string, date: Date) {
  const knownLabels: Record<string, string> = {
    "Asia/Kolkata": "IST",
    "Asia/Dubai": "GST",
    "Asia/Singapore": "SGT",
    "Asia/Tokyo": "JST",
    "Asia/Seoul": "KST",
    "Europe/London": "GMT",
    "Europe/Paris": "CET",
    "America/New_York": "ET",
    "America/Los_Angeles": "PT",
    "Australia/Sydney": "AEST",
  };
  if (knownLabels[timeZone]) return knownLabels[timeZone];
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(date).find((item) => item.type === "timeZoneName");
  return part?.value || timeZone;
}

function formatDateTime(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatter.format(date).replace(/,/g, "")} ${timezoneLabel(timeZone, date)}`;
}

function getTimezone(airport: Destination) {
  try {
    return tzLookup(airport.latitude, airport.longitude);
  } catch {
    return "UTC";
  }
}

export function createWaypointTicket(origin: Destination, destination: Destination, durationSeconds: number, now = new Date()): WaypointTicket {
  const originCode = airportCode(origin);
  const destinationCode = airportCode(destination);
  const tripCode = `WP-${randomToken(4)}-${randomToken(4)}`;
  const flightNumber = `WY ${String(100 + (tripCode.charCodeAt(3) + tripCode.charCodeAt(7)) % 800)}`;
  const gate = `${String.fromCharCode(65 + (tripCode.charCodeAt(4) % 5))}${1 + (tripCode.charCodeAt(5) % 28)}`;
  const seat = `${1 + (tripCode.charCodeAt(6) % 28)}${String.fromCharCode(65 + (tripCode.charCodeAt(7) % 6))}`;
  const departure = new Date(now.getTime() + 15 * 60 * 1000);
  const arrival = new Date(departure.getTime() + Math.max(durationSeconds, 60) * 1000);
  const boarding = new Date(departure.getTime() - 15 * 60 * 1000);
  const originTimezone = getTimezone(origin);
  const destinationTimezone = getTimezone(destination);

  return {
    tripCode,
    flightNumber,
    gate,
    seat,
    originCode,
    destinationCode,
    originCity: origin.city,
    destinationCity: destination.city,
    originTimezone,
    destinationTimezone,
    departureAt: formatDateTime(departure, originTimezone),
    arrivalAt: formatDateTime(arrival, destinationTimezone),
    boardingAt: formatDateTime(boarding, originTimezone),
    durationSeconds,
    issuedAt: now.toISOString(),
  };
}
