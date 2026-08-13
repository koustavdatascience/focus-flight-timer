/* Cloud Atlas Editorial map: real OSM geography with compact floating UI layered above it. */

import { divIcon, latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from "@/config/map";
import type { Destination } from "@/services/airportSearch";
import { aircraftAtProgress, greatCircleRoute, routeCoordinatesAtProgress, type Coordinate, type GeodesicRoute } from "@/services/route";

type MapMode = "landing" | "selecting" | "active";

type FlightMapProps = {
  origin?: Destination | null;
  destination?: Destination | null;
  progress?: number;
  mode: MapMode;
  landingFocus?: Destination | null;
  onMapClick?: (coordinate: Coordinate) => void;
};

const originIcon = divIcon({ className: "flight-marker-icon", html: '<span class="flight-marker-origin" aria-hidden="true"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
const destinationIcon = divIcon({ className: "flight-marker-icon", html: '<span class="flight-marker-destination" aria-hidden="true"></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
function planeIconForBearing(bearing: number) {
  // The glyph faces east at rest, so subtract 90° from a north-based geographic bearing.
  return divIcon({
    className: "flight-plane-icon",
    html: `<span aria-hidden="true" style="display:block;transform:rotate(${bearing - 90}deg)">✈</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function MapViewport({ origin, destination, mode, landingFocus, route }: Pick<FlightMapProps, "origin" | "destination" | "mode" | "landingFocus"> & { route: GeodesicRoute | null }) {
  const map = useMap();
  useEffect(() => {
    if (mode === "landing") {
      const center = landingFocus ? [landingFocus.latitude, landingFocus.longitude] as [number, number] : MAP_CONFIG.landingCenter;
      map.flyTo(center, landingFocus ? 7 : MAP_CONFIG.landingZoom, { duration: 1.1 });
      return;
    }
    if (!origin || !destination) return;
    const routeCoordinates = route?.animationCoordinates;
    const bounds = routeCoordinates && routeCoordinates.length > 1
      ? latLngBounds(routeCoordinates.map((coordinate) => [coordinate.latitude, coordinate.longitude] as [number, number]))
      : latLngBounds([[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]]);
    map.flyToBounds(bounds, { padding: [110, 110], maxZoom: mode === "active" ? 5 : 6, duration: 1.25 });
  }, [destination?.latitude, destination?.longitude, landingFocus?.id, landingFocus?.latitude, landingFocus?.longitude, mode, origin?.latitude, origin?.longitude, route, map]);
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

export function FlightMap({ origin, destination, progress = 0, mode, landingFocus = null, onMapClick }: FlightMapProps) {
  const hasRoute = Boolean(origin && destination);
  const route = hasRoute && origin && destination ? greatCircleRoute({ latitude: origin.latitude, longitude: origin.longitude }, { latitude: destination.latitude, longitude: destination.longitude }) : null;
  const aircraft = route ? aircraftAtProgress(route, progress) : null;
  const visibleRoute = route ? routeCoordinatesAtProgress(route, mode === "active" ? progress : 1) : [];
  const renderedOrigin = route?.animationCoordinates[0] ?? (origin ? { latitude: origin.latitude, longitude: origin.longitude } : null);
  const renderedDestination = route?.animationCoordinates.at(-1) ?? (destination ? { latitude: destination.latitude, longitude: destination.longitude } : null);

  return (
    <MapContainer className="flight-map-canvas" center={MAP_CONFIG.defaultCenter} zoom={MAP_CONFIG.defaultZoom} minZoom={2} maxZoom={12} scrollWheelZoom doubleClickZoom dragging zoomControl attributionControl>
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} crossOrigin />
      <MapViewport origin={origin} destination={destination} mode={mode} landingFocus={landingFocus} route={route} />
      <MapClickHandler onMapClick={onMapClick} />
      {hasRoute && origin && destination && <>
        {visibleRoute.length > 1 && <Polyline positions={visibleRoute.map((coordinate) => [coordinate.latitude, coordinate.longitude])} pathOptions={{ color: "#0d78ce", weight: 3, opacity: 0.92, dashArray: "9 12", lineCap: "round" }} />}
        {renderedOrigin && <CircleMarker center={[renderedOrigin.latitude, renderedOrigin.longitude]} radius={6} pathOptions={{ color: "#182c42", weight: 3, fillColor: "#f6f3ec", fillOpacity: 1 }} />}
        {renderedDestination && <CircleMarker center={[renderedDestination.latitude, renderedDestination.longitude]} radius={7} pathOptions={{ color: "#eb3e7c", weight: 3, fillColor: "#ffffff", fillOpacity: 1 }} />}
        {renderedOrigin && <Marker position={[renderedOrigin.latitude, renderedOrigin.longitude]} icon={originIcon}>
          <Popup><strong>{origin.iata || origin.icao}</strong><br />{origin.name}</Popup>
        </Marker>}
        {renderedDestination && <Marker position={[renderedDestination.latitude, renderedDestination.longitude]} icon={destinationIcon}>
          <Popup><strong>{destination.iata || destination.city}</strong><br />{destination.name}</Popup>
        </Marker>}
        {mode === "active" && aircraft && <Marker position={[aircraft.coordinate.latitude, aircraft.coordinate.longitude]} icon={planeIconForBearing(aircraft.bearing)} interactive={false} zIndexOffset={500} />}
      </>}
    </MapContainer>
  );
}
