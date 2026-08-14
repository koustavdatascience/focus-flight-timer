# Validation notes

## 2026-08-14 — Leaderboards

The public `/leaderboards` route was visually verified at 1280px and 390px widths. The default Monthly Solo Focus state renders with clear category and period tabs, an explanatory empty state, opt-out disclosure, and no horizontal overflow at the mobile breakpoint.

## 2026-08-14 — Public information pages

The `/about`, `/changelog`, `/feedback`, `/privacy`, and `/terms` routes were visually verified at 1280px. The content uses a consistent editorial shell, clear primary navigation, working footer destinations, and readable long-form legal drafts. `/about`, `/feedback`, and `/privacy` were also verified at 390px; cards, headings, disclosures, and footer links reflow without horizontal overflow. The unauthenticated feedback state correctly presents a sign-in call to action rather than exposing a submission form.

## 2026-08-14 — SEO, crawl controls, and focus guides

The new `/guides` index and `/guides/pomodoro-timer` article were visually verified at 1280px and 390px. The index cards, guide typography, calls to action, and responsive footer remain legible without horizontal overflow. The production bundle completed successfully, emitting both `robots.txt` and `sitemap.xml`; the sitemap includes the Pomodoro guide URL. Route-specific titles, descriptions, canonical URLs, and structured data are supplied through the shared SEO metadata boundary.

## 2026-08-14 — Expansion release validation

The final automated sequence completed successfully: `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`. The suite reports 16 passing test files and 50 passing tests. The end-to-end flight smoke test confirmed map tiles, origin/destination selection, a visible route, sourced-or-estimated duration disclosure, active-flight markers, pause/resume behavior, and live geocoding without browser errors.

Desktop visual regression checks covered the landing page, authenticated-route gates, Co-Focus, rankings, public information routes, and guide routes. The deployed production homepage and `/leaderboards` route rendered successfully. Live `robots.txt` permits public content while excluding private routes, and live `sitemap.xml` lists the intended public pages and guides.

The final Supabase security advisor reports one informational `feedback_submissions` finding because direct table access is deliberately denied by RLS and the application writes through the authenticated, rate-limited `submit_focusflight_feedback` RPC. It also reports warnings for intentionally exposed `SECURITY DEFINER` lifecycle and social RPCs. These routines are executed only by the authenticated role (except the deliberately privacy-filtered public profile reader), use fixed search paths, and enforce actor, ownership, membership, or block checks inside the routines. Anonymous execution remains revoked for social write and overview RPCs.

## 2026-08-14 — Public-pages addendum and Supabase Preview repair

The approved public-pages addendum was validated after the About field-guide, lighter public navigation, factual changelog language, technical transparency, and legal/feedback disclosures were refreshed. Desktop full-page checks at 1280px covered `/about`, `/changelog`, `/privacy`, `/terms`, `/feedback`, and `/guides`. Mobile full-page checks at 375px covered `/about`, `/changelog`, and `/feedback`. The revised content, cards, long-form text, sign-in feedback state, and footer links remained readable and reflowed without visible horizontal overflow.

Automated validation completed with `pnpm test` (16 test files and 52 tests passing), `pnpm check`, `pnpm build`, and `pnpm test:e2e`. The end-to-end smoke test continued to pass map tiles, route selection, timer/flight synchronization, pause behavior, and live geocoding. The Supabase Preview check failure was traced to locally descriptive expansion-migration filenames that did not match versions recorded remotely. The repository migration filenames and the migration contract test were reconciled to the existing remote versions without modifying SQL or production data; the corrected change was pushed to the private `main` branch, and the GitHub Supabase Preview integration completed successfully.

## 2026-08-14 — Waypoint rebrand

The user-approved Waypoint rebrand was applied across visible application copy, authentication messaging, public pages, guides, legal drafts, document metadata, JSON-LD, route-specific SEO metadata, README content, and current operational documentation. The established Vercel origin, Supabase project reference, database/RPC identifiers, migration history, and Google OAuth callback URI were intentionally preserved to avoid disrupting production sessions, user data, deployment, or authentication.

Automated validation completed with `pnpm test` (16 files and 52 tests passing), `pnpm check`, `pnpm build`, and `pnpm test:e2e`. The smoke test continues to verify the flight-selection and active-flight experience while tolerating transient third-party map-tile resource failures only; application errors remain test failures. Desktop checks covered the landing page, About page, Co-Focus, My Journey, leaderboards, and public guides. Mobile checks confirmed the Waypoint wordmark, navigation, public page hierarchy, and map-first home experience at 375px without visible overflow. The external-domain, Google OAuth consent-screen, Supabase redirect, and Search Console steps required for any future Waypoint domain migration are documented in `docs/waypoint-rebrand-configuration.md`.

## 2026-08-14 — Founder-note copy refinement

The About-page independent-project note now uses the user-supplied first-person Waypoint founder message. Full-page visual checks at 1280px and 375px confirm the additional paragraphs remain legible, the feedback call to action stays visible, the paired development-log card remains aligned, and no horizontal overflow is visible. `pnpm check`, `pnpm test` (17 files and 53 tests), and `pnpm build` also completed successfully.

## 2026-08-14 — Remaining public-page audit

The attached public-information plan was reconciled with the existing Waypoint implementation. The Changelog, authenticated Feedback, Privacy working draft, and Terms working draft are already registered as public routes, linked in the shared footer, and represented in route-specific metadata. Full-page checks at 1280px and 375px confirmed each page remains readable, uses the shared editorial presentation, retains the feedback privacy gate where applicable, and has no visible horizontal overflow.

## 2026-08-14 — Legal working-draft refinement

Waypoint's Privacy Policy and Terms working drafts were rewritten around the user-supplied policy structure and limited to current, verified product capabilities. Both drafts retain clear qualified-counsel review framing, distinguish virtual focus data from physical location or travel data, avoid unsupported paid-service and account-deletion claims, and publish the user-supplied legal contact address. Full-page checks at 1280px and 375px confirmed readable long-form copy, visible contact details, functional shared navigation and footer links, and no visible horizontal overflow. `pnpm check`, `pnpm test` (18 files and 56 tests), and `pnpm build` completed successfully.

## 2026-08-14 — About-page legal links

The independent-project section on `/about` now provides direct, visibly labelled links to the Privacy Policy and Terms of Service in addition to its feedback action. Full-page checks at 1280px and 375px confirmed the links remain legible, keyboard-reachable anchors, and fit the existing editorial card without horizontal overflow. `pnpm check`, `pnpm test` (18 files and 57 tests), and `pnpm build` completed successfully.

## 2026-08-14 — Project Waypoint repository and deployment address

The GitHub repository is public and was renamed to `koustavdatascience/project-waypoint`; the Vercel project was renamed to `project-waypoint`. The unavailable `waypoint.vercel.app` and `project-waypoint.vercel.app` aliases were not used. The available production address `https://project-waypoint-app.vercel.app` was assigned and confirmed to serve the current deployment. Canonical metadata, structured data, robots, sitemap, URL regression tests, README links, deployment guidance, and rebrand documentation now use the assigned address; legacy URLs remain only where migration instructions or historical records require them.

`pnpm check`, `pnpm test` (18 files and 57 tests), and `pnpm build` completed successfully after the canonical-origin update. The required remaining transition work is owner-managed: add the new production address in Supabase URL Configuration and Google OAuth authorized origins, retain the old address temporarily, then complete email-recovery and Google sign-in checks at the new address.
