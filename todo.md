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
- [x] Verify short and long routes across map scales, then commit and push the repair; save its recovery checkpoint next.

The route service now obtains WGS84 great-circle coordinates from Turf, renders dateline-safe segments in Leaflet, and calculates the moving aircraft’s location and bearing from that exact same path. The requested CCU routes were checked in unit tests and in the real browser map at two zoom levels; no invalid or world-spanning SVG path values were produced.

## Acapulco long-haul route review

- [x] Inspect the CCU → Acapulco great-circle output and Leaflet segment presentation shown in the attached screenshot.
- [x] Correct the dateline presentation by rendering one continuous unwrapped great-circle path in the neighbouring world copy while keeping the shared aircraft geometry intact.
- [x] Re-verify Acapulco and related long-haul routes at practical map scales before checkpointing the correction.

The corrected Acapulco route is a continuous WGS84 shortest-path arc over the northern Pacific/Arctic, with no artificial control points or dateline break. Because CCU and ACA are near-antipodal, this legitimate great-circle reaches high latitudes; the long arc seen on a Web Mercator world map is geographic rather than a custom loop. The live map, endpoint markers, viewport bounds, and aircraft now share the same unwrapped longitude sequence, while the journey history map retains safely split segments for multi-route overview rendering.

## Gentle flight-arc refinement

- [x] Replace the high-latitude long-haul display with a low-amplitude longitude/latitude path that retains the selected endpoints and dateline safety.
- [x] Use the same gentle coordinates for the visible line, progressive reveal, aircraft position, and geographic heading.
- [x] Verify the revised visual curvature on regional, long-haul, and dateline-crossing routes before checkpointing the change.

The flight route now blends the geographic great-circle reference toward the direct unwrapped latitude/longitude connection at a fixed 16% geographic strength. It does not use map pixels, viewport measurements, or a separate animation curve. The Acapulco capture confirms a small Pacific arc instead of a polar semicircle; regional and dateline-crossing paths remain finite and continuous.

## Two-card route selector revision

- [x] Replace the three featured airport cards with exactly two route-selector cards.
- [x] Make the first card display and select the starting location, and the second display and select the destination.
- [x] Preserve search, real-map markers, duration preparation, and responsive route-selection behavior.
- [x] Verify the simplified selector at desktop and mobile widths, then checkpoint the change.

The landing page now displays exactly two location cards: Starting location and Destination. Both cards remain keyboard-accessible buttons that switch the existing airport search mode; the destination card guides an unstarted journey back to origin selection. Desktop and 390px mobile renders show the two cards without clipping while retaining the real New York map, geolocation control, and search field.

## Live CCU-to-JFK journey verification

- [x] Select CCU as origin and JFK as destination in the live application.
- [x] Start the CCU-to-JFK flight and verify the visible route remains aligned with aircraft progress and revealed travel path.
- [x] Report the live route and timer behavior without persisting a production test trip.

Guest-mode browser verification selected CCU → JFK and started a 16h 30m estimated journey without authentication or trip persistence. The active map showed three markers (origin, destination, aircraft), three geographic map paths, no browser errors, and a running timer at 16:29:59 after launch. The saved capture visually confirms the aircraft and endpoint markers on the active geographic route.

## Active-flight route visibility repair

- [x] Restore a persistent planned-route trace during active flights so the full path remains legible behind the aircraft.
- [x] Render a distinct travelled-route layer that progressively reveals from the origin to the aircraft.
- [x] Verify the active route layer in a live CCU-to-JFK start sequence and verify midpoint/completion geometry through the shared route-progress tests.
- [x] Save a recovery checkpoint for the active-flight route visibility repair.

The repair separates the persistent dashed blue planned path from the solid pink travelled path and memoizes route geometry by endpoint coordinates. This prevents the Leaflet viewport from restarting its `flyToBounds` animation for every timer tick. The live CCU-to-JFK capture now visibly shows the 4.6px planned path spanning 923px, endpoint and aircraft markers, a running timer, and no browser errors. The shared route tests continue to validate progressive midpoint and final geometry.

## Vercel deployment preparation

- [x] Assess the existing Vercel connection and the full-stack runtime compatibility.
- [x] Add a Vercel-compatible static build and SPA routing configuration without exposing credentials.
- [x] Validate the production client build and document required Vercel environment variables and deployment steps.
- [x] Save and push the Vercel-ready project state.

The GitHub-linked Vercel project exists at `focus-flight-timer.vercel.app`, but its initial Vite autodetection ran the repository's generic `build` script and published the Express bundle instead of the browser application. The Vercel configuration now explicitly runs the client-only build, publishes `dist/public`, and includes the SPA rewrite required for direct `/journey` navigation. The local Vercel build, TypeScript check, and 19 unit tests pass. The deployment still requires the existing public Supabase URL and publishable key to be entered in Vercel's environment-variable settings; no credentials were committed.

## Vercel production-environment completion

- [x] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the selected Vercel project for Production and Preview.
- [x] Add the Vercel production Site URL and redirect URL to the selected Supabase project's Auth URL configuration.
- [x] Redeploy and verify the live FocusFlight landing page, sign-in dialog, and `/journey` route in a browser.
- [x] Keep preview-specific Supabase Auth redirects deferred for the current production-only scope; add an exact preview URL later if preview email authentication testing is needed.

The selected Vercel project now has its two public browser variables in both Production and Preview. Supabase Auth Site URL is `https://focus-flight-timer.vercel.app`, with the deployed application route wildcard allowed under that domain. The live root page renders the interactive Leaflet map and airport controls, `/journey` resolves as a client route, and the deployed sign-in dialog initializes successfully. A preview-specific redirect URL is only needed if authentication is tested on a separate preview hostname.

## User-selected Vercel project provisioning

- [x] Configure the Vite import screen with the two required public Supabase values for Production and Preview.
- [x] Deploy the newly selected Vercel project from the linked GitHub `main` branch.
- [x] Verify the fresh deployment, direct `/journey` routing, and Supabase Auth production redirect URL configuration.

The user selected the Vercel new-project flow for `koustavdatascience/focus-flight-timer`, rather than updating the earlier imported project. The repository already contains the client-only build and SPA rewrite configuration, so no Build or Output Settings overrides were required in the Vercel import form. The live root URL now renders the interactive New York landing map and controls, a direct request to `/journey` renders the signed-out Journey screen rather than a Vercel 404, and the production Supabase Auth return domain is configured for email confirmation and password recovery.

## Product roadmap repository update

- [x] Add the user-approved FocusFlight product expansion roadmap to the repository documentation and push it to GitHub.

## Public information pages — planning only

- [x] Prepare an implementation-ready suggestion for the About, Privacy Policy, and Terms of Service pages without changing the application.

## Public-page planning repository update

- [x] Add the approved public-information pages planning addendum to repository documentation and push it to GitHub.

## 25 August launch-scope assessment — planning only

- [x] Define a launch-critical FocusFlight scope and a deferred post-launch scope for a 25 August 2026 target date without starting implementation.

## Repository README update

- [x] Create and publish a current-state README covering FocusFlight features, architecture, setup, deployment, and contribution boundaries.

## Approved product expansion

- [x] Establish shared Supabase data models, RLS policies, and migration foundations for profiles, social features, rooms, group flights, and leaderboard aggregates.
- [x] Add password recovery and Google authentication entry points while retaining email/password sign-in.
- [x] Build profile identity, solo statistics, location privacy, and public-profile routing.
- [x] Build persistent rooms, authoritative all-member presence, and synchronized group-flight lifecycle controls.
- [x] Add separate group histories and valid optional solo-location sync offers.
- [x] Add friendship, blocking, and privacy-enforced friend-gated profile access.
- [x] Add Solo and Co-Focus leaderboards with monthly and all-time completed-focus-time rankings.
- [x] Create About, Feedback, Changelog, Privacy, and Terms pages.
- [x] Add SEO metadata, sitemap, crawl controls, and original launch content.
- [x] Complete security, automated, browser, and production validation before release.
- [x] Publish the verified expansion to GitHub and Vercel.
- [x] After the approved product expansion is fully verified and published, implement the separate public-information-pages planning addendum supplied by the user.

## Public-pages planning addendum implementation

- [x] Research Waypoint domain, app, and public brand conflicts before applying a rebrand.
- [x] Close the Waypoint rebrand path after the availability audit found material conflicts; preserve the current brand until a more distinctive candidate is selected.
- [x] Implement the user-approved final Waypoint rebrand across application copy, public pages, SEO, documentation, and project configuration.
- [x] Update the external branding configuration checklist for Waypoint and validate the completed rebrand before publication.
- [x] Research Meridian domain, app, and public brand conflicts before applying a rebrand.
- [x] Close the Meridian rebrand path after the availability audit found a direct active productivity-app conflict; preserve the current brand until a more distinctive candidate is selected.
- [x] Configure the currently disabled Google OAuth provider in Supabase and validate the FocusFlight sign-in return flow.
- [x] Repair successful Google OAuth returns that leave FocusFlight displaying the unauthenticated Sign In state.
- [x] Repair the Supabase Preview workflow failure caused by remote migration versions missing from the local migration directory.
- [x] Refine the shared public-page information architecture while keeping primary navigation intentionally light and public destinations reachable in the footer.
- [x] Rebuild the About page as a content-led field guide with an honest virtual-flight explanation, four-step flow, verified shipped capabilities, independent-project note, technical transparency, factual development log, and working feedback path.
- [x] Update factual changelog, legal-draft framing, feedback disclosures, and public-route metadata to reflect verified current capabilities without unsupported claims.
- [x] Add focused public-page coverage and validate keyboard access, desktop/mobile layouts, build output, crawl controls, and production rendering.
- [x] Publish the completed public-pages addendum and save a recovery checkpoint.
- [x] Replace the About-page independent-project section with the user-provided founder note and preserve its accessible editorial presentation.
- [x] Reconcile the Changelog, Feedback, Privacy, and Terms pages with the attached public-information plan and complete any absent page content or integrations.
- [x] Verify the remaining public-page routes, metadata, footer links, and responsive behavior before publishing the update.
- [x] Replace the Privacy Policy and Terms working drafts with an accurate Waypoint-specific adaptation of the user-supplied legal copy, retaining explicit attorney-review framing.
- [x] Verify legal-page copy, public metadata, desktop/mobile layout, and automated coverage before publication.
- [x] Publish the user-supplied Waypoint legal contact address in the Privacy Policy and Terms working drafts.
- [x] Add clear Privacy Policy and Terms links to the About page and verify their public-route destinations.
- [x] Rename the public GitHub repository to `project-waypoint`, retaining public visibility and redirects.
- [x] Rename the Vercel project to `project-waypoint` and inspect the generated deployment address.
- [x] Assign the alternate `project-waypoint-app.vercel.app` production address and verify the resulting public deployment configuration.
- [x] Replace stale Vercel deployment references in Waypoint documentation and public metadata with `project-waypoint-app.vercel.app`, preserving the old URL only where migration guidance requires it.
- [x] Update Supabase Site URL and redirect allow list for `project-waypoint-app.vercel.app` while retaining the legacy address during transition.
- [x] Add `project-waypoint-app.vercel.app` to Google OAuth authorized JavaScript origins and configure the replacement Google OAuth client in Supabase.
- [x] Create a dedicated Project Waypoint Google Cloud project, configure a replacement OAuth web client, and connect its credentials to Supabase.
- [x] Verify password recovery and Google sign-in on the new production address before retiring the legacy redirect address.
- [x] Replace the stale FocusFlight GitHub About description and legacy homepage link with current Project Waypoint content and `https://project-waypoint-app.vercel.app`.
- [x] Inspect the narrow-screen landing map and ensure airport selectors and focus-flight controls remain accessible without unintended clipping.
- [x] Remove Leaflet’s visible plus/minus zoom controls while preserving map interaction.
- [x] Add a random-destination generator that accepts a preferred focus duration and proposes an eligible airport whose realistic flight duration is closest to that target.
- [x] Add automated coverage and validate the updated random-route journey at desktop and mobile widths.
- [x] Extend Find a place to choose a random valid origin when none is selected, then choose a duration-matched eligible destination while retaining New York as the initial landing-map view.
- [x] Add regression coverage and validate the random-origin route flow at desktop and mobile widths.
- [x] Change first-use Find a place so it selects and centers a random starting airport only, leaving destination selection empty for the user.
- [x] Add regression coverage and validate the destination-free first-use and subsequent destination-selection flows.
- [x] Add an on-brand Waypoint favicon for browser tabs and public pages.
- [x] Implement shared, non-personal live presence that counts current Waypoint explorers and active flights through Supabase Realtime.
- [x] Add and validate a responsive lower-corner live-activity indicator using the real presence counts.
- [x] Add an active-flight follow camera that zooms toward the aircraft and smoothly keeps it in view with forward-looking heading context.
- [x] Add automated coverage and validate the active-flight camera behavior at desktop and mobile widths.
- [x] Rotate the active-flight map with the aircraft bearing so the plane remains vertically oriented toward the top of the screen.
- [x] Add camera-orientation regression coverage and validate the rotated active-flight experience at desktop and mobile widths.
- [x] Make the starting-location card generate and cycle through random origins when clicked.
- [x] Make the destination card generate and cycle through random destinations when clicked, showing each route duration regardless of the selected focus-time target.
- [x] Keep Find a place as the only duration-matched destination action, without locking the result, and add a Done / Continue to flight action after route finalization.
- [x] Add regression coverage and validate the updated card-selection and active-flight flow.

## Interactive route-selection UX refinement

- [x] Make the Starting location card cycle through random eligible airports on click without auto-selecting a destination.
- [x] Make the Destination card cycle through random eligible airports on click and display the resolved flight duration.
- [x] Refine Find a place so it suggests duration-matched options without locking the route, while preserving duration-aware recommendations.
- [x] Add a clear Done/Continue confirmation action before entering the active flight view.
- [x] Update route-selection validation notes and run the full test suite across desktop and mobile flows.

## Browser-tab logo refinement

- [x] Replace the current Waypoint browser-tab logo with the user-provided or user-approved favicon asset.
- [x] Verify the favicon metadata and production build after the replacement.

## Deployed favicon verification

- [x] Synchronize the new favicon checkpoint to the public GitHub/Vercel source branch.
- [x] Verify the deployed favicon metadata and document any required Vercel redeploy or browser-cache refresh.

- [x] Replace the generated storage URL with a source-controlled favicon asset so Vercel serves the tab logo instead of SPA fallback HTML.

## GitHub-hosted favicon asset link

- [x] Upload the Waypoint route-mark image to the public GitHub repository.
- [x] Link the tab-logo metadata to the public repository-hosted asset and verify the URL.

## Replacement tab-logo concept

- [x] Explore a new Waypoint browser-tab logo concept; superseded by the user's supplied star mark before publication.
- [x] Update the GitHub-hosted favicon link, verify the public image, and push the replacement.

## User-provided star favicon

- [x] Prepare the supplied black-and-white star image for efficient browser-tab use.
- [x] Replace the current favicon asset and metadata with the user-approved star image, then push and verify it.

## Launch and sharing strategy

- [x] Research relevant focus, student, productivity, indie-maker, travel, and design communities alongside their promotion norms.
- [x] Create an automation-ready multi-channel Waypoint sharing strategy with platform-specific content, approvals, cadence, tracking, and anti-spam safeguards.

## Product Hunt launch images

- [x] Create an original Product Hunt thumbnail and gallery image set that communicates Waypoint’s focus-flight product experience.
- [x] Review the assets for clear product positioning and deliver them for launch-page selection.
- [x] Capture and prepare a truthful Product Hunt gallery from real Waypoint route-selection, route-review, and active-flight screens while AI image generation is unavailable.

## Open-source repository housekeeping

- [ ] Add a standalone MIT license file to the public Waypoint repository.
- [ ] Add selected truthful Product Hunt launch images and their usage notes to the public Waypoint repository.
