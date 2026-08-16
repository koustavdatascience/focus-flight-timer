export const ACTIVE_FLIGHT_MIN_ZOOM = 6.4;

export function forwardCameraDistance(viewportWidth: number, viewportHeight: number) {
  return Math.max(54, Math.min(viewportWidth, viewportHeight) * 0.2);
}

export function forwardHeadingOffset(bearing: number, distance: number) {
  const headingRadians = (bearing * Math.PI) / 180;
  return {
    x: Math.sin(headingRadians) * distance,
    y: -Math.cos(headingRadians) * distance,
  };
}

/** Rotate the map opposite the aircraft heading so its nose stays vertical on screen. */
export function navigationMapRotation(bearing: number) {
  const normalizedBearing = ((bearing % 360) + 360) % 360;
  return normalizedBearing === 0 ? 0 : -normalizedBearing;
}
