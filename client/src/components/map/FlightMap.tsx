/* Cloud Atlas Editorial map: real OSM geography with compact floating UI layered above it. */

import { divIcon, latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from "@/config/map";
import type { Destination } from "@/services/airportSearch";
import { coordinateAtProgress, greatCircleRoute, type Coordinate } from "@/services/route";

type MapMode = "selecting" | "active";

type FlightMapProps = {
  origin: Destination;
  destination: Destination;
  progress: number;
  mode: MapMode;
  onMapClick?: (coordinate: Coordinate) => void;
};

const originIcon = divIcon({ className: "flight-marker-icon", html: '<span class="flight-marker-origin" aria-hidden="true"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
const destinationIcon = divIcon({ className: "flight-marker-icon", html: '<span class="flight-marker-destination" aria-hidden="true"></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
const planeIcon = divIcon({ className: "flight-plane-icon", html: '<span aria-hidden="true">✈</span>', iconSize: [42, 42], iconAnchor: [21, 21] });

function MapViewport({ origin, destination, mode }: Pick<FlightMapProps, "origin" | "destination" | "mode">) {
  const map = useMap();
  useEffect(() => {
    const bounds = latLngBounds([[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]]);
    map.flyToBounds(bounds, { padding: [110, 110], maxZoom: mode === "active" ? 5 : 6, duration: 1.25 });
  }, [destination.latitude, destination.longitude, mode, origin.latitude, origin.longitude, map]);
  return null;
}

function MapClickHandler({ onMapClick }: Pick<FlightMapProps, "onMapClick">) {
  useMapEvents({
    click(event) {
      onMapClick?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

export function FlightMap({ origin, destination, progress, mode, onMapClick }: FlightMapProps) {
  const route = greatCircleRoute({ latitude: origin.latitude, longitude: origin.longitude }, { latitude: destination.latitude, longitude: destination.longitude });
  const aircraft = coordinateAtProgress(route, progress);

  return (
    <MapContainer className="flight-map-canvas" center={MAP_CONFIG.defaultCenter} zoom={MAP_CONFIG.defaultZoom} minZoom={2} maxZoom={12} scrollWheelZoom doubleClickZoom dragging zoomControl attributionControl>
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} crossOrigin />
      <MapViewport origin={origin} destination={destination} mode={mode} />
      <MapClickHandler onMapClick={onMapClick} />
      <Polyline positions={route} pathOptions={{ color: "#0d78ce", weight: 3, opacity: 0.92, dashArray: "9 12", lineCap: "round" }} />
      <CircleMarker center={[origin.latitude, origin.longitude]} radius={6} pathOptions={{ color: "#182c42", weight: 3, fillColor: "#f6f3ec", fillOpacity: 1 }} />
      <CircleMarker center={[destination.latitude, destination.longitude]} radius={7} pathOptions={{ color: "#eb3e7c", weight: 3, fillColor: "#ffffff", fillOpacity: 1 }} />
      <Marker position={[origin.latitude, origin.longitude]} icon={originIcon}>
        <Popup><strong>{origin.iata || origin.icao}</strong><br />{origin.name}</Popup>
      </Marker>
      <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}>
        <Popup><strong>{destination.iata || destination.city}</strong><br />{destination.name}</Popup>
      </Marker>
      {mode === "active" && <Marker position={aircraft} icon={planeIcon} interactive={false} zIndexOffset={500} />}
    </MapContainer>
  );
}
