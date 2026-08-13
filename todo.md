# Landing-page revision checklist

- [x] Replace the multi-section editorial site with one full-viewport landing page.
- [x] Match the supplied reference composition: slim header, map backdrop, centered headline, three route cards, route button, location control, and search field.
- [x] Keep FocusFlight’s original branding and use the existing generated map asset rather than copying the reference site’s logo or map tiles.
- [x] Preserve working route selection, custom duration input, location control feedback, and timer-start behavior within the landing page.
- [x] Verify the page at desktop and mobile widths, then save a new checkpoint.
- [x] Inspect the newly attached text file for final copy or layout requirements.
- [x] Apply relevant attachment requirements: active map mode, dynamic route line, aircraft progress, pause/sound/flight controls, timer card, distance card, back button, responsive placement, and completion state.
- [x] Re-run type checking, production build, and desktop preview verification.
- [x] Inspect the new attachment for additional product or visual requirements.
- [x] Apply the new attachment requirements without regressing the active-flight journey.
- [x] Re-run checks, verify both responsive states, and save an updated checkpoint.

## Global airport database and real-map revision

- [x] Fetch a verified airport dataset from a real public source and preserve source metadata.
- [x] Normalize airport records with IATA, ICAO, city, country, coordinates, type, and priority fields.
- [x] Add broad global coverage with especially strong Indian commercial-airport coverage.
- [x] Isolate map provider configuration, airport search, geocoding, route calculation, and timer animation concerns.
- [x] Replace the decorative map in selection and active-flight states with Leaflet/OpenStreetMap tiles.
- [x] Verify search, pan/zoom, markers, route, distance, timer-linked aircraft progress, pause/resume, and back flow.

## Map implementation note

The existing `MapView` wrapper targets Google Maps. The new requirement explicitly asks for a keyless real geographic map, so the implementation will use Leaflet with OpenStreetMap tiles in a dedicated `FlightMap` component. The decorative map remains available only as the visual landing-page backdrop; it will not be used in destination-selection or active-flight map mode.

## Current code baseline

`Home.tsx` currently owns route data, search matching, Haversine distance, timer state, SVG route geometry, and both landing/active UI states. `index.css` currently positions the decorative generated map and SVG route using viewport percentages. The next refactor moves airport data, map provider settings, search, geodesic route points, and Leaflet rendering into separate modules while retaining the existing class-based visual language.

## Final visual verification

The selection screenshot shows a real world map with visible OpenStreetMap geography, zoom controls, origin and destination markers, a dashed route, and a compact destination card. The active screenshot shows the full-screen geographic map, dashed route, aircraft marker, top-right controls, and bottom-corner timer/distance cards. The preview-mode banner is management chrome outside the app viewport and is not part of the deployed page.
