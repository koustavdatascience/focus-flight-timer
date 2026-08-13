import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from "@/config/map";
import type { Destination } from "@/services/airportSearch";
import { greatCircleRoute } from "@/services/route";

export type JourneyRoute = {
  id: string;
  origin: Destination;
  destination: Destination;
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

export function JourneyMap({ routes }: { routes: JourneyRoute[] }) {
  return (
    <MapContainer className="journey-map-canvas" center={MAP_CONFIG.defaultCenter} zoom={MAP_CONFIG.defaultZoom} minZoom={2} maxZoom={12} scrollWheelZoom doubleClickZoom dragging zoomControl attributionControl>
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} crossOrigin />
      <JourneyViewport routes={routes} />
      {routes.map((route, index) => {
        const line = greatCircleRoute(route.origin, route.destination);
        const hue = index % 2 === 0 ? "#0d78ce" : "#eb3e7c";
        return <Polyline key={route.id} positions={line} pathOptions={{ color: hue, weight: 3, opacity: 0.86, dashArray: "9 11", lineCap: "round" }} />;
      })}
      {routes.flatMap((route) => [route.origin, route.destination]).map((airport) => <CircleMarker key={`${airport.id}`} center={[airport.latitude, airport.longitude]} radius={5} pathOptions={{ color: "#182c42", weight: 2, fillColor: "#f6f3ec", fillOpacity: 1 }} />)}
    </MapContainer>
  );
}
