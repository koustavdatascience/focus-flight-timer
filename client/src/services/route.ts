/* Geographic route math: Turf great-circle coordinates drive the rendered route and aircraft state. */

import { greatCircle } from "@turf/great-circle";
import { point } from "@turf/helpers";

export type Coordinate = { latitude: number; longitude: number };

export type GeodesicRoute = {
  /** Continuous longitude values used for interpolation, including values outside ±180° when crossing the dateline. */
  animationCoordinates: Coordinate[];
  /** Dateline-safe latitude/longitude line segments ready for Leaflet rendering. */
  renderSegments: Coordinate[][];
  crossesAntimeridian: boolean;
};

export type AircraftState = {
  coordinate: Coordinate;
  bearing: number;
  visibleSegments: Coordinate[][];
};

const EARTH_RADIUS_KM = 6371;
const EPSILON = 0.000001;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

function degrees(value: number) {
  return (value * 180) / Math.PI;
}

export function normaliseLongitude(longitude: number) {
  const normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
  return Math.abs(normalized + 180) < EPSILON && longitude > 0 ? 180 : normalized;
}

function sameCoordinate(a: Coordinate | undefined, b: Coordinate) {
  if (!a) return false;
  return Math.abs(a.latitude - b.latitude) < EPSILON && Math.abs(a.longitude - b.longitude) < EPSILON;
}

function unwrapCoordinates(coordinates: readonly (readonly (readonly number[])[])[]) {
  const result: Coordinate[] = [];
  for (const line of coordinates) {
    for (const position of line) {
      const longitude = position[0];
      const latitude = position[1];
      if (typeof longitude !== "number" || typeof latitude !== "number") continue;
      let unwrappedLongitude = longitude;
      const previous = result.at(-1);
      if (previous) {
        while (unwrappedLongitude - previous.longitude > 180) unwrappedLongitude -= 360;
        while (unwrappedLongitude - previous.longitude < -180) unwrappedLongitude += 360;
      }
      const coordinate = { latitude, longitude: unwrappedLongitude };
      if (!sameCoordinate(previous, coordinate)) result.push(coordinate);
    }
  }
  return result;
}

/** Split a continuous geographic route at ±180° so Leaflet never joins the world edges with one giant line. */
export function splitAtAntimeridian(coordinates: Coordinate[]) {
  if (coordinates.length === 0) return [] as Coordinate[][];

  const segments: Coordinate[][] = [[{
    latitude: coordinates[0].latitude,
    longitude: normaliseLongitude(coordinates[0].longitude),
  }]];

  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    const longitudeDelta = current.longitude - previous.longitude;
    const world = Math.floor((previous.longitude + 180) / 360);
    const eastwardBoundary = 180 + world * 360;
    const westwardBoundary = -180 + world * 360;
    const boundary = longitudeDelta > 0 ? eastwardBoundary : westwardBoundary;
    const crossesBoundary = longitudeDelta > 0
      ? previous.longitude < eastwardBoundary - EPSILON && current.longitude >= eastwardBoundary - EPSILON
      : previous.longitude > westwardBoundary + EPSILON && current.longitude <= westwardBoundary + EPSILON;

    if (crossesBoundary) {
      const ratio = (boundary - previous.longitude) / longitudeDelta;
      const latitude = previous.latitude + (current.latitude - previous.latitude) * ratio;
      const edgeLongitude = longitudeDelta > 0 ? 180 : -180;
      segments.at(-1)?.push({ latitude, longitude: edgeLongitude });
      segments.push([{ latitude, longitude: -edgeLongitude }, {
        latitude: current.latitude,
        longitude: normaliseLongitude(current.longitude),
      }]);
      continue;
    }

    segments.at(-1)?.push({ latitude: current.latitude, longitude: normaliseLongitude(current.longitude) });
  }

  return segments.filter((segment) => segment.length > 0);
}

export function distanceBetween(a: Coordinate, b: Coordinate) {
  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLon = radians(b.longitude - a.longitude);
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

/**
 * Produce a true great-circle route in WGS84 longitude/latitude space.
 * Turf returns a MultiLineString when a route crosses the antimeridian; the route is rejoined only for interpolation
 * and is rendered as separate edge-safe segments.
 */
export function greatCircleRoute(start: Coordinate, end: Coordinate, steps = 160): GeodesicRoute {
  const geometry = greatCircle(
    point([start.longitude, start.latitude]),
    point([end.longitude, end.latitude]),
    { npoints: Math.max(2, steps), offset: 10 },
  ).geometry;
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  const animationCoordinates = unwrapCoordinates(lines);
  const renderSegments = splitAtAntimeridian(animationCoordinates);

  return {
    animationCoordinates,
    renderSegments,
    crossesAntimeridian: renderSegments.length > 1,
  };
}

function interpolate(a: Coordinate, b: Coordinate, amount: number): Coordinate {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * amount,
    longitude: a.longitude + (b.longitude - a.longitude) * amount,
  };
}

export function coordinateAtProgress(route: GeodesicRoute, progress: number) {
  const coordinates = route.animationCoordinates;
  if (coordinates.length === 0) return { latitude: 0, longitude: 0 };
  if (coordinates.length === 1) return coordinates[0];
  const safeProgress = Math.max(0, Math.min(1, progress));
  const position = safeProgress * (coordinates.length - 1);
  const lowerIndex = Math.floor(position);
  return interpolate(coordinates[lowerIndex], coordinates[Math.min(lowerIndex + 1, coordinates.length - 1)], position - lowerIndex);
}

/**
 * Return the continuous unwrapped coordinate sequence for a visible portion of a route.
 * Leaflet can render longitudes outside ±180° as a neighbouring world copy, which keeps a
 * dateline-crossing great-circle visually continuous instead of breaking it into two arcs.
 */
export function routeCoordinatesAtProgress(route: GeodesicRoute, progress: number) {
  const coordinates = route.animationCoordinates;
  if (coordinates.length === 0) return [] as Coordinate[];
  const safeProgress = Math.max(0, Math.min(1, progress));
  const position = safeProgress * (coordinates.length - 1);
  const lastIndex = Math.floor(position);
  const visible = coordinates.slice(0, lastIndex + 1);
  if (lastIndex < coordinates.length - 1) {
    visible.push(interpolate(coordinates[lastIndex], coordinates[lastIndex + 1], position - lastIndex));
  }
  return visible;
}

export function bearingBetween(a: Coordinate, b: Coordinate) {
  const deltaLongitude = radians(normaliseLongitude(b.longitude - a.longitude));
  const startLatitude = radians(a.latitude);
  const endLatitude = radians(b.latitude);
  const y = Math.sin(deltaLongitude) * Math.cos(endLatitude);
  const x = Math.cos(startLatitude) * Math.sin(endLatitude) - Math.sin(startLatitude) * Math.cos(endLatitude) * Math.cos(deltaLongitude);
  return (degrees(Math.atan2(y, x)) + 360) % 360;
}

export function routeSegmentsAtProgress(route: GeodesicRoute, progress: number) {
  return splitAtAntimeridian(routeCoordinatesAtProgress(route, progress));
}

export function aircraftAtProgress(route: GeodesicRoute, progress: number): AircraftState {
  const coordinate = coordinateAtProgress(route, progress);
  const coordinates = route.animationCoordinates;
  if (coordinates.length < 2) return { coordinate, bearing: 0, visibleSegments: routeSegmentsAtProgress(route, progress) };
  const position = Math.max(0, Math.min(1, progress)) * (coordinates.length - 1);
  const index = Math.floor(position);
  const next = coordinates[Math.min(index + 1, coordinates.length - 1)];
  const previous = coordinates[Math.max(0, index - 1)];
  return {
    coordinate,
    bearing: bearingBetween(index === coordinates.length - 1 ? previous : coordinate, next),
    visibleSegments: routeSegmentsAtProgress(route, progress),
  };
}
