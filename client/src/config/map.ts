/* Cloud Atlas Editorial map system: real geography sits beneath the editorial UI; provider settings stay replaceable. */

export const MAP_CONFIG = {
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  nominatimUrl: "https://nominatim.openstreetmap.org/search",
  defaultCenter: [20, 0] as [number, number],
  defaultZoom: 2,
};
