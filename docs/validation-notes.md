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
