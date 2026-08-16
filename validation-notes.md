# Waypoint route-selection UX validation

## Scope

This validation covers the interactive pre-flight route-selection refinement: independent random cycling for origin and destination cards, duration-aware suggestions from **Find a place** without automatic route lock-in, and the manual **Done — review this route** confirmation step.

## Automated checks

| Check | Result |
|---|---|
| TypeScript (`pnpm check`) | Passed with no type errors |
| Vitest (`pnpm test`) | Passed: 20 test files, 67 tests |
| Production build (`pnpm build`) | Passed; Vite and server bundle completed |
| Random destination helper coverage | Added and passing; excludes the origin and ignores focus-time matching |

## Browser verification

The live preview was checked at desktop and mobile dimensions. On desktop, the landing page displayed exactly two route cards, the real New York-centered map, the duration selector, the **Find a place** action, and the search control. On mobile, the same controls remained readable and usable without horizontal overflow.

The interactive flow was verified in the browser as follows:

1. Clicking **Starting location** selected a random airport, kept the user on the landing page, cleared any prior destination, and updated the destination search context.
2. Clicking **Destination** selected a different random airport and resolved a transparent duration estimate while keeping the user on the landing page.
3. The destination card displayed the selected city and resolved duration, for example `Peshawar · 3h 30m`.
4. **Done — review this route** appeared only after a valid origin, destination, and duration were available. Clicking it transitioned to the real route-review map rather than starting the timer immediately.
5. The route-review map showed the origin marker, destination marker, dashed geographic route, distance, duration provenance, and the existing **Start focus flight** action.

The live preview still reports the expected Vite asset warning for the existing `/manus-storage/focusflight-hero-map_6e4d3ba6.png` reference; it is an existing runtime-resolved asset warning and does not block the route-selection flow or production build.

## Vercel favicon diagnosis

The public GitHub repository was one commit behind the favicon checkpoint: GitHub served the old SVG reference while the local checkpoint contained the new PNG reference. The favicon checkpoint was pushed to `main` as `2f486e3`. The first live Vercel inspection occurred before Vercel rebuilt, so the deployed icon may remain cached or may still reflect the prior deployment.

Deployed favicon links observed during the inspection: [(['icon'], 'image/svg+xml', '/manus-storage/waypoint-tab-icon_ce1ae494.svg')]

## Vercel favicon deployment verification

Vercel created a READY production deployment from commit `2f486e3` and assigned all four project domains, including `project-waypoint-app.vercel.app`, to it. The live HTML now references `/manus-storage/waypoint-route-mark_f7ed2e54.png`; the earlier inspection showed the old SVG only because it ran before the new deployment completed. If the tab still shows the prior mark, force-refresh the site or close and reopen the tab; the favicon image itself may also still be finishing background generation.
