import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from "@/config/map";
import type { Destination } from "@/services/airportSearch";
import { greatCircleRoute } from "@/services/route";

export type JourneyRoute = {
  id: string;
  origin: Destination;
  destination: Destination;
  distanceKm: number;
  focusDurationSeconds: number;
  completedAt: string | null;
};

function JourneyViewport({ routes }: { routes: JourneyRoute[] }) {
  const map = useMap();
  useEffect(() => {
    if (routes.length === 0) return;
    const coordinates = routes.flatMap((route) => [
      [route.origin.latitude, route.origin.longitude] as [number, number],
      [route.destination.latitude, route.destination.longitude] as [number, number],
    ]);
    map.flyToBounds(latLngBounds(coordinates), { padding: [44, 44], maxZoom: routes.length === 1 ? 5 : 4, duration: 1 });
  }, [map, routes]);
  return null;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

export function JourneyMap({ routes }: { routes: JourneyRoute[] }) {
  const airports = Array.from(new Map(routes.flatMap((route) => [route.origin, route.destination]).map((airport) => [airport.id, airport])).values());

  return (
    <MapContainer className="journey-map-canvas" center={MAP_CONFIG.defaultCenter} zoom={MAP_CONFIG.defaultZoom} minZoom={2} maxZoom={12} scrollWheelZoom doubleClickZoom dragging zoomControl attributionControl>
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} crossOrigin />
      <JourneyViewport routes={routes} />
      {routes.map((route, index) => {
        const line = greatCircleRoute(route.origin, route.destination);
        const hue = index % 2 === 0 ? "#0d78ce" : "#eb3e7c";
        const date = route.completedAt ? new Date(route.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Completed focus flight";
        return <Polyline key={route.id} positions={line} pathOptions={{ color: hue, weight: 3, opacity: 0.86, dashArray: "9 11", lineCap: "round" }}><Popup className="journey-map-popup"><div className="journey-popup-route"><span>{route.origin.iata || route.origin.icao || route.origin.city} → {route.destination.iata || route.destination.icao || route.destination.city}</span><strong>{route.distanceKm.toLocaleString()} km</strong><small>{formatDuration(route.focusDurationSeconds)} focus · {date}</small></div></Popup></Polyline>;
      })}
      {airports.map((airport) => {
        const connectedRoutes = routes.filter((route) => route.origin.id === airport.id || route.destination.id === airport.id);
        const code = airport.iata || airport.icao || airport.city;
        return <CircleMarker key={airport.id} center={[airport.latitude, airport.longitude]} radius={5} pathOptions={{ color: "#182c42", weight: 2, fillColor: "#f6f3ec", fillOpacity: 1 }}><Popup className="journey-map-popup"><div className="journey-popup-airport"><span>{code}</span><strong>{airport.name}</strong><small>{airport.city}, {airport.country}</small><b>{connectedRoutes.length} connected route{connectedRoutes.length === 1 ? "" : "s"} · {connectedRoutes.length} visit{connectedRoutes.length === 1 ? "" : "s"}</b></div></Popup></CircleMarker>;
      })}
    </MapContainer>
  );
}
