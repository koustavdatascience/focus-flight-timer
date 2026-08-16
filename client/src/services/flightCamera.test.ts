import { describe, expect, it } from "vitest";
import { ACTIVE_FLIGHT_MIN_ZOOM, forwardCameraDistance, forwardHeadingOffset } from "./flightCamera";

describe("active flight camera geometry", () => {
  it("uses a close-follow zoom with a sensible forward-looking distance", () => {
    expect(ACTIVE_FLIGHT_MIN_ZOOM).toBe(6.4);
    expect(forwardCameraDistance(1280, 720)).toBe(144);
    expect(forwardCameraDistance(200, 200)).toBe(54);
  });

  it("keeps camera context in front of the aircraft heading", () => {
    expect(forwardHeadingOffset(0, 80)).toEqual({ x: 0, y: -80 });
    expect(forwardHeadingOffset(90, 80).x).toBeCloseTo(80);
    expect(forwardHeadingOffset(90, 80).y).toBeCloseTo(0);
    expect(forwardHeadingOffset(180, 80).y).toBeCloseTo(80);
  });
});
