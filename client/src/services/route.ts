/* Cloud Atlas Editorial route math: coordinates drive distance, geodesic path, and aircraft progress. */

export type Coordinate = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceBetween(a: Coordinate, b: Coordinate) {
  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLon = radians(b.longitude - a.longitude);
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

export function greatCircleRoute(start: Coordinate, end: Coordinate, segments = 72) {
  const startLat = radians(start.latitude);
  const startLon = radians(start.longitude);
  const endLat = radians(end.latitude);
  const endLon = radians(end.longitude);
  const startVector = [Math.cos(startLat) * Math.cos(startLon), Math.cos(startLat) * Math.sin(startLon), Math.sin(startLat)];
  const endVector = [Math.cos(endLat) * Math.cos(endLon), Math.cos(endLat) * Math.sin(endLon), Math.sin(endLat)];
  const dot = Math.min(1, Math.max(-1, startVector[0] * endVector[0] + startVector[1] * endVector[1] + startVector[2] * endVector[2]));
  const omega = Math.acos(dot);
  const sineOmega = Math.sin(omega);

  return Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    const scaleStart = sineOmega === 0 ? 1 - t : Math.sin((1 - t) * omega) / sineOmega;
    const scaleEnd = sineOmega === 0 ? t : Math.sin(t * omega) / sineOmega;
    const x = scaleStart * startVector[0] + scaleEnd * endVector[0];
    const y = scaleStart * startVector[1] + scaleEnd * endVector[1];
    const z = scaleStart * startVector[2] + scaleEnd * endVector[2];
    return [Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI), Math.atan2(y, x) * (180 / Math.PI)] as [number, number];
  });
}

export function coordinateAtProgress(route: [number, number][], progress: number) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const index = Math.min(route.length - 1, Math.floor(safeProgress * (route.length - 1)));
  return route[index] || route[0];
}
