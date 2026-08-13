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

- [x] Inspect the latest attached text for new functional or visual requirements.
- [x] Apply the attachment requirements without reintroducing a default origin or destination.
- [x] Run type, build, end-to-end, and responsive visual checks.
- [x] Save a new deliverable checkpoint.

## Repository and Supabase provisioning revision

- [x] Create a private GitHub repository and push the current FocusFlight project.
- [x] Avoid creating a new Supabase backend because the user supplied the existing Tokyo project for this integration.
- [x] Provision the Supabase project and securely configure the application connection.
- [x] Implement Supabase Auth, user profile persistence, completed-trip saving, and user-isolated travel history.
- [x] Add a My Journey map with personal route, airport, visit-count, and distance insights.
- [x] Verify the authenticated persistence flow and push the completed integration changes to GitHub.

## Paused live-integration UI-shell revision

- [x] Supersede the paused-client boundary after the user asked for autonomous live integration.
- [x] Build the sign-in, profile, travel-history, and My Journey interface shell with live authenticated data flows.
- [x] Preserve the existing guest flight-selection flow and real map journey.
- [x] Verify the UI shell and build, then commit and push the repository to GitHub.

## Immediate GitHub push

- [x] Commit the current FocusFlight workspace, including the in-progress UI shell and Supabase preparation files.
- [x] Push the commit to the private FocusFlight GitHub repository and verify the remote state.

## Newly connected Supabase backend check

- [x] Inspect available Supabase projects and identify the newly connected FocusFlight backend.
- [x] Confirm whether the new project replaces the previously provisioned backend before changing any app configuration.

## Selected Tokyo backend

- [x] Treat Supabase project `uuzqivzkskqnwsflgdou` in Tokyo as FocusFlight’s sole backend.
- [x] Verify and apply the profiles-and-trips schema with user-scoped RLS to the selected project.
- [x] Keep the live browser client disconnected until the user asks to resume integration; the user later requested autonomous completion and activated it.

The selected Tokyo project now has `profiles` and `trips`. The schema stores only canonical airport identifiers in these tables, keeps all airport names and coordinates in the existing client dataset, and enables Auth-backed RLS so each user can access only their own profile and trips.

The migration is now applied to the selected Tokyo project. `profiles` and `trips` are present, both reference `auth.users`, both have Row Level Security enabled, and the live browser client is configured through managed public environment variables.

The Supabase security advisor initially flagged an unrelated RLS event-trigger helper as publicly executable. Its execute privilege was revoked from `public`, `anon`, and `authenticated`; a final security review returned no remaining advisories.

## Auth, database, and travel-history revision

The attachment requires Supabase Auth, Supabase Postgres/RLS, persistent profiles and trips, and user-scoped travel history. The current project is static and has no Supabase configuration, so implementation requires a full-stack upgrade plus a connected Supabase project URL and anon key (or an existing Supabase connector). No auth or database code will be fabricated against placeholder credentials.

## Provisioned backend

The FocusFlight Supabase project is the user-selected Tokyo project. The implementation uses Supabase Auth for browser sessions and a client service configured only through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Profiles and trips are protected by database RLS policies based on `auth.uid()`.

## Post-upgrade application baseline

The original FocusFlight `Home` screen remains intact but needs its Supabase authentication imports and feature wiring restored. The router currently contains only the landing route, so the personal My Journey experience will be a separate route with navigation from the landing header. The existing full-stack server scaffold will remain available, while Supabase will own browser authentication and persisted user travel data.

## UI-shell layout decision

The template dashboard layout is intended for internal tools and would replace the public cartographic landing experience with a generic sidebar. FocusFlight retains its bespoke public header and uses a contextual My Journey route with a clear return path. Live authentication and persistence are implemented against the selected backend rather than simulated.

## UI-shell implementation baseline

The landing retains the correct origin-first real-map flight flow and an English visual system. Its full-stack upgrade conflict was repaired, and the contextual My Journey route reads only the signed-in user’s actual persisted records.

## Current origin baseline

Origin state is nullable in the page controller, and an origin is only passed to geocoding, routing, and map components after an airport is explicitly selected.

## Current localization baseline

`Home.tsx` keeps the selected destination nullable until the traveller makes an explicit choice, and the geocoding service prefers English labels when supplied.

## Autonomous completion request

- [x] Repair the upgraded full-stack application and restore clean type and runtime checks.
- [x] Connect the browser client to the confirmed Tokyo Supabase project with managed environment configuration.
- [x] Implement authentication-aware profile creation, editable display name, and user-isolated trip persistence.
- [x] Save, resume, pause, complete, and render personal focus-flight journeys without changing the guest route-selection rules.
- [x] Add the authenticated My Journey route with a real personal route map, completed-session list, and calculated totals.
- [x] Add focused Vitest coverage and run build, end-to-end, desktop, and mobile verification.
- [x] Commit and push the completed integration to the private GitHub repository, then save a recovery checkpoint.

- [x] Add visited-airport count and most-frequent-airport insight to My Journey from authenticated trip history.
- [x] Verify the browser Supabase configuration, resumable-trip schema, and user-scoped profile/trip RLS policies without inserting customer or test records.
- [x] Verify the email-confirmed flow structurally without creating test customer accounts; live end-to-end confirmation is available to the user through the shipped sign-in UI.
- [x] Add interactive airport and route popups on My Journey with airport identity, visit count, connected routes, and route date, duration, and distance.

The autonomous completion work now uses the selected Tokyo Supabase project directly through managed browser variables. It adds email/password authentication, Auth-backed profile creation, user-isolated RLS trip persistence, pause/resume state, a personal Leaflet journey map, and responsive visual checks. No customer data or fabricated trip records were inserted during verification.

## Realistic duration and landing-map revision

- [x] Default the real interactive landing map to New York City for guests and signed-in users without completed trips.
- [x] Preserve the latest completed destination as the real landing-map focus for returning users.
- [x] Research direct-flight duration data sources and define a separate `flightDurations` cache model.
- [x] Use sourced direct-flight durations where verified and transparent commercial-aircraft estimates only when no direct duration is available.
- [x] Connect stored duration seconds to destination cards, timer initialization, aircraft progress, and trip persistence without hardcoding values in React components.
- [x] Verify duration-cache behavior, New York/default restoration logic, route simulation, responsive UI, and existing guest/authenticated flows.
- [x] Commit and push the completed realistic-duration and landing-map revision; save its recovery checkpoint next.

- [x] Add focused automated coverage for authenticated landing-map restoration from completed trip history and for persisted duration metadata passed to trip saving.
- [x] Document the live email-confirmed verification boundary without creating customer or test records in the production backend.

The automated checks verify that the landing restores the destination of the latest completed trip (by completion time) and that authenticated trip creation retains the route key, duration seconds, source type, and source label. A live sign-up/confirmation run is intentionally not executed against the production backend because it would create a test account and persisted records; the shipped email-auth UI remains available for the account owner’s normal verification.

## Geodesic flight-path repair

- [x] Replace custom curved route rendering with shared great-circle coordinates calculated exclusively in longitude/latitude space.
- [x] Split or unwrap antimeridian-crossing paths so no world-spanning line is rendered.
- [x] Drive visible route reveal, aircraft position, and geographic bearing rotation from the same generated geodesic coordinates.
- [x] Add automated geographic tests for CCU → DEL, BLR, BOM, Dubai, London, New York, Calgary, and Acapulco.
- [ ] Verify short and long routes across map scales, then commit, push, and checkpoint the repair.

The route service now obtains WGS84 great-circle coordinates from Turf, renders dateline-safe segments in Leaflet, and calculates the moving aircraft’s location and bearing from that exact same path. The requested CCU routes were checked in unit tests and in the real browser map at two zoom levels; no invalid or world-spanning SVG path values were produced.
