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

## Default state and English localization revision

- [x] Do not select or highlight any airport on initial landing-page load.
- [x] Keep destination, airport, country, search, and control labels in English.
- [x] Prefer English Nominatim name details when available.
- [x] Verify explicit search/card selection still opens the real map and active-flight flow.

## Empty-origin revision

- [x] Remove the fixed Singapore origin from the default state and map flow.
- [x] Add explicit origin search/selection alongside destination selection.
- [x] Keep the route, distance, timer, and active-flight screens blocked until both airports are selected.
- [x] Verify reset/back behavior clears the origin and destination for the next session.

## Latest attachment revision

- [ ] Inspect the latest attached text for new functional or visual requirements.
- [ ] Apply the attachment requirements without reintroducing a default origin or destination.
- [ ] Run type, build, end-to-end, and responsive visual checks.
- [ ] Save a new deliverable checkpoint.

## Repository and Supabase provisioning revision

- [ ] Create a private GitHub repository and push the current FocusFlight project.
- [ ] Obtain and confirm the exact Supabase project cost before creating a new backend.
- [ ] Provision the Supabase project and securely configure the application connection.
- [ ] Implement Supabase Auth, user profile persistence, completed-trip saving, and user-isolated travel history.
- [ ] Add a My Journey map with personal route, airport, visit-count, and distance insights.
- [ ] Verify the authenticated persistence flow and push the completed integration changes to GitHub.

## Paused live-integration UI-shell revision

- [ ] Keep live Supabase client configuration disconnected from the current application build.
- [ ] Build the sign-in, profile, travel-history, and My Journey interface shell using clearly labeled empty and loading states only.
- [ ] Preserve the existing guest flight-selection flow and real map journey.
- [ ] Verify the UI shell and build, then commit and push the repository to GitHub.

## Immediate GitHub push

- [ ] Commit the current FocusFlight workspace, including the in-progress UI shell and Supabase preparation files.
- [ ] Push the commit to the private FocusFlight GitHub repository and verify the remote state.

## Auth, database, and travel-history revision

The attachment requires Supabase Auth, Supabase Postgres/RLS, persistent profiles and trips, and user-scoped travel history. The current project is static and has no Supabase configuration, so implementation requires a full-stack upgrade plus a connected Supabase project URL and anon key (or an existing Supabase connector). No auth or database code will be fabricated against placeholder credentials.

## Provisioned backend

The FocusFlight Supabase project is provisioned in the Mumbai region. The implementation will use Supabase Auth for browser sessions and a client service configured only through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Profiles and trips will be protected by database RLS policies based on `auth.uid()`.

## Post-upgrade application baseline

The original FocusFlight `Home` screen remains intact but needs its Supabase authentication imports and feature wiring restored. The router currently contains only the landing route, so the personal My Journey experience will be a separate route with navigation from the landing header. The existing full-stack server scaffold will remain available, while Supabase will own browser authentication and persisted user travel data.

## UI-shell layout decision

The template dashboard layout is intended for internal tools and would replace the public cartographic landing experience with a generic sidebar. FocusFlight will retain its bespoke public header and add a contextual My Journey route with a clear return path instead. Live authentication and persistence remain visibly marked as a future connection point rather than being simulated with account or trip data.

## UI-shell implementation baseline

The landing already has the correct origin-first real-map flight flow and an English visual system. Its upgrade conflict is limited to an orphaned `useAuth` reference, which will be removed while building the paused-integration shell. The existing stylesheet contains reusable cartographic backdrop, floating-card, map, and mobile-navigation treatments that can support an empty My Journey page without introducing fabricated personal metrics or travel records.

## Current origin baseline

`origin.ts` exports a fixed `SIN` origin and `Home.tsx` passes it to all distance, geocoding, route, and flight-map calculations. The revision will make origin nullable in the page state, add a reusable origin search mode, and pass an origin only after an airport is explicitly selected.

## Current localization baseline

`Home.tsx` initializes `selectedDestination` to the first featured airport and calculates its route and timer immediately. `geocoding.ts` currently derives labels from `address` and `display_name` without requesting Nominatim `namedetails`, so the revision will make the selected destination nullable and prefer `name:en`/English address fields when supplied.
