/* Cloud Atlas Editorial map system: real geography sits beneath the editorial UI; provider settings stay replaceable. */

export const MAP_CONFIG = {
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  nominatimUrl: "https://nominatim.openstreetmap.org/search",
  defaultCenter: [40.7128, -74.006] as [number, number],
  defaultZoom: 8,
  landingCenter: [40.7128, -74.006] as [number, number],
  landingZoom: 8,
};
