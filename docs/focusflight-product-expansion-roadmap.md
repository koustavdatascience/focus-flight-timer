# FocusFlight Product Expansion Roadmap

## Purpose and outcome

This plan covers the next major FocusFlight release: account improvements, an SEO-ready public product surface, persistent group rooms and co-focus flights, a strictly separated solo/group travel model, manual solo-location syncing, public and friends-only profiles, friendships and blocking, achievements, and leaderboard systems. It preserves the current product’s visual identity, its real Leaflet/OpenStreetMap journey experience, its Supabase Tokyo project as the product backend, and its Vercel/GitHub continuous deployment workflow.

The release will make **focus time** the primary product metric. Virtual distance remains a supporting exploration statistic. The product hierarchy will remain: **focus first, travel narrative second, social comparison third**.

| Area | Current state | Target state |
|---|---|---|
| Deployment | Vercel production site is live and deploys on GitHub `main` pushes | Keep the same automated deployment path; extend it with production checks and SEO assets |
| Auth | Supabase email/password sign-up and sign-in | Add password recovery, password update, Google OAuth, and account safety states |
| Solo travel | `profiles` and `trips` hold private solo data; completed trips populate My Journey | Preserve existing trip behavior and add an authoritative solo-location event stream |
| Co-Focus | Navigation placeholder only | Persistent rooms, real-time presence, group sessions, history, and optional post-completion sync offers |
| Journey/profile | Private My Journey page with basic profile editing | Private account hub plus a privacy-controlled public pilot profile |
| Rankings | None | Monthly and all-time Solo Focus and Co-Focus boards, with opt-out and privacy enforcement |
| Discovery | Single-page application with limited crawlable content | Fast, indexable product pages, metadata, sitemap, and search-console readiness |

## Product decisions locked by this plan

The implementation should treat the following as product rules, rather than UI suggestions. Any later changes should be made through explicit migrations and versioned policy updates, not ad hoc client behavior.

| Decision | Rule to implement |
|---|---|
| Solo current location | Changes only after a solo flight completes, or after the user deliberately accepts a valid group-flight sync. Pausing, resuming, or abandoning a solo flight does not move it. |
| Solo progress | Solo focus/travel credit is granted only for a completed flight. In-progress and abandoned sessions have no leaderboard credit or location movement. |
| Group history | Is a separate, append-only record. Group sessions never update solo history or current location by themselves. |
| Group room membership | A group flight requires every current room member to participate; no subset can launch. The member list is persisted as a start-time snapshot for deterministic enforcement, but no separate roster-selection feature is exposed. |
| Group progression | A group flight progresses only while every required room member is present. It pauses immediately when one is absent and resumes only when all return. It is abandoned if no required member remains present. |
| Group session end | An abandoned session is retained in history with an explicit status; it never reaches its destination. A new attempt creates a new session. |
| Manual sync | A distinct offer is generated per eligible completed group session. It is never forced, never appears during flight, and never rewrites solo-flight history. |
| Multiple sync offers | Group activity does not invalidate other offers. Starting any new solo flight invalidates all pending offers. Accepting one moves the current solo location and leaves competing offers historically visible but no longer actionable if their origin no longer matches. |
| Leaderboards | Completed focus time is the ranking metric. Distance is a secondary Explorer statistic. Solo and Co-Focus boards remain separate. |
| Periods | Monthly is the default competitive window; all-time is a career view. Periods are calculated in UTC and do not require a destructive reset job. |
| Streak | The main streak is solo-only: consecutive UTC calendar days containing at least one completed solo flight. A separate Co-Focus statistic may be added, but not merged into the main streak. |
| Privacy | Public profile visibility and leaderboard participation are separate switches. Current virtual location has `only_me`, `shared_rooms`, and `public` visibility modes. |
| Friendships | Mutual friendship is required for friends-only depth. Sharing a room never creates friendship automatically. |
| Social safety | Blocking is included in the first social release. It removes friendship, cancels pending requests, prevents future requests/invites, and hides friends-only material without deleting history. |

## Architecture and hosting approach

The shipped application persists its product data directly in Supabase from a React/Vite client. The template’s tRPC/MySQL layer is not currently the source of truth for journeys. This release should keep Supabase as the sole product backend and move sensitive state transitions into Supabase-managed, server-authoritative operations. The browser should remain responsible for presentation and optimistic UI only.

| Approach | Trade-offs | Cost | Setup complexity |
|---|---|---:|---:|
| **Supabase database functions, Row Level Security, Realtime Presence, and Edge Functions** | Matches the existing data path; no permanent custom server; requires carefully designed SQL policies and atomic functions | Included within the project’s Supabase usage tier, subject to its quotas | Moderate |
| Custom real-time coordinator service | More direct control over presence and timers, but adds a separate server, operations burden, and security surface | Additional hosting and maintenance | High |

The recommended approach is the first option. Persist group state in Supabase tables; use transactional Postgres functions for join/start/pause/resume/complete/abandon/sync transitions; use Supabase Realtime Presence for live member presence; and render a local visual countdown from server-authorized timing fields. A member’s browser must not be trusted to complete a session, increment rankings, or update another member’s record.

No recurring job is necessary to “reset” a monthly leaderboard. Each completed flight will be assigned a UTC month key, and queries will filter by the requested period. Aggregates can be updated transactionally when a flight completes or recomputed from append-only events. This avoids polling and background-worker dependency. If future features require scheduled badge backfills or dormant-session cleanup, use deterministic database-side scheduling or an application-managed periodic job rather than a manual agent schedule.

## Domain model and Supabase schema plan

### 1. Extend the existing solo model safely

The existing `trips` table remains the record for solo focus flights. Keep its completed/in-progress behavior intact. Add explicit fields and immutable events instead of inferring too much from the latest row at read time.

| Table or view | Key fields | Purpose |
|---|---|---|
| `profiles` (extend) | `handle`, `bio`, `avatar_path`, `location_visibility`, `leaderboard_opt_in`, `solo_current_airport_id`, `solo_location_version`, `public_profile_enabled` | User identity, privacy controls, current virtual location cache, and an epoch used to protect sync offers |
| `solo_location_events` | `id`, `user_id`, `event_type`, `airport_id`, `source_trip_id`, `source_group_session_id`, `solo_location_version`, `created_at` | Immutable audit trail for completed solo arrivals and accepted group-session syncs |
| `trips` (extend) | `lifecycle_status` or existing `status`, `started_at`, `completed_at`, completion period key | Continue storing the solo journey; increment `solo_location_version` as soon as a new solo flight starts |
| `user_stat_snapshots` or read-only views | period, completed solo seconds, flights, distance, streak inputs | Fast profile and leaderboard reads without trusting browser-side aggregation |

Create a one-time migration that derives an initial `solo_current_airport_id` and an initial arrival event from each account’s latest completed solo trip. Accounts with no completed solo trips retain no personal location and keep the existing New York landing-map behavior.

### 2. Add rooms and group-flight records

Rooms are persistent groups. A room flight is a separate session within a room. The system must distinguish a room member from a temporarily present flight participant so that “leave the flight” does not accidentally mean “leave the room.”

| Table | Key fields | Rules enforced |
|---|---|---|
| `rooms` | `id`, `name`, `slug_or_invite_code`, `owner_id`, `visibility`, `created_at`, `archived_at` | Persistent group container; room creation and invite policy |
| `room_members` | `room_id`, `user_id`, `role`, `joined_at`, `left_at` | Current room membership; unique user/room pair |
| `group_flight_sessions` | `id`, `room_id`, origin/destination airport IDs, duration, distance, `status`, `elapsed_active_seconds`, `last_resumed_at`, `started_at`, `completed_at`, `abandoned_at` | One room-owned route/timer; status machine is server-authoritative |
| `group_flight_participants` | `session_id`, `user_id`, `joined_at`, `presence_status`, `completed_at` | Start-time membership snapshot and per-user participation history |
| `group_presence_heartbeats` (ephemeral/short retention if needed) | `session_id`, `user_id`, last seen | Optional durable fallback for Realtime Presence and recovery diagnostics |

The group session state machine should have the explicitly testable statuses: `boarding`, `active`, `paused_waiting_for_members`, `completed`, and `abandoned`. A room creator opens boarding with a selected route. All current room members confirm readiness. Once every member is ready/present, the creator starts the session. The implementation must explicitly define how ownership is transferred if the creator leaves; the proposed default is to permit any still-present room administrator to start a new session, while an already active session keeps its persisted state.

### 3. Model sync offers without contaminating solo history

Sync offers are their own domain records, not a Boolean on a group session or a mutation of a solo trip.

| Table | Key fields | Validity behavior |
|---|---|---|
| `group_location_sync_offers` | `id`, `user_id`, `group_session_id`, `origin_airport_id`, `destination_airport_id`, `solo_location_version_at_creation`, `status`, `created_at`, `used_at`, `invalidated_at` | One offer per eligible member per completed group session; statuses include `pending`, `used`, and `invalidated_by_new_solo_flight` |

At group-session completion, a database function evaluates every participant independently. It creates an offer only when the participant’s solo current airport equals the group origin at that moment. Starting a new solo flight increments that user’s solo-location version and invalidates all pending offers in one transaction. Accepting an offer verifies that it is pending, the stored version still matches, and the current solo airport still equals the offer origin; it then writes a `solo_location_events` row, updates the profile cache to the group destination, and marks only that offer as used. Other offers remain historically independent but are displayed as unavailable when their origin no longer matches the user’s current solo location.

### 4. Add profiles, social graph, rankings, and achievements

Public identity must be queryable without exposing private data. Friends-only detail must be protected in database policies as well as hidden in the interface.

| Table or view | Key fields | Purpose |
|---|---|---|
| `public_profile_view` | handle, display name, avatar, allowed location field, public stats | Sanitized public profile response; never includes email, raw private trips, or disallowed location |
| `friend_requests` | `requester_id`, `recipient_id`, `status`, `created_at`, `resolved_at` | Directional request lifecycle with a single active request per canonical pair |
| `friendships` | `user_id_low`, `user_id_high`, `created_at` | Canonical mutual relationship; pair uniqueness prevents reverse duplicates |
| `blocks` | `blocker_id`, `blocked_id`, `created_at` | Enforces social isolation and access revocation |
| `leaderboard_periods` or period view | `period_type`, `period_start_utc`, `period_end_utc` | Query basis for monthly/all-time rankings |
| `leaderboard_entries` or aggregate view | user, category, period, completed seconds, completed flights, rank inputs | Serves Solo Focus and Co-Focus rankings without exposing raw logs |
| `achievements` and `user_achievements` | code, criteria version, earned_at | Idempotent milestone awards with a versioned badge catalogue |

Use competition-style shared ranks for ties (`1, 1, 3`), while sorting equal scores deterministically by the timestamp that score was achieved and then by a stable user ID only for display. Leaderboards must exclude users who opt out; no placeholder row should disclose that an opted-out user exists.

## Security, authorization, and privacy design

All sensitive reads and writes must be designed around Supabase Row Level Security. The client’s publishable key is expected to be visible in the browser; it must never receive service-role credentials or the power to bypass policies.

| Capability | Authorization rule |
|---|---|
| Own solo trips, private profile, pending offers | Owner only |
| Public pilot profile | Only the sanitized public-profile view, subject to profile and location visibility toggles |
| Friends-only journey and statistics | Current mutual friendship, with no block in either direction |
| Room read/write | Current room membership and no block relationship that prohibits invitation/access |
| Group start/pause/resume/complete | Database function validates session status, room membership snapshot, caller role, and current presence state |
| Sync acceptance | Only the offer owner, via atomic function with version and airport checks |
| Leaderboard rows | Public aggregate values only for opted-in users; no private location, room identity, email, or raw session details |
| Block action | Removes friendship, resolves/cancels requests, prevents future invite/request writes, and suppresses friends-only views |

Add rate limits and abuse controls at the database/function boundary: handle uniqueness checks, outgoing friend-request caps, one active request per pair, a re-request cooldown after decline, invite issuance limits, and idempotency keys for state-changing client retries. Use security-definer functions only when necessary, with fixed `search_path`, narrow privileges, and tests proving that a user cannot alter another user’s data.

## User experience workstreams

### Authentication and account recovery

Extend `SupabaseAuthContext.tsx` and the existing `AuthDialog` with a password-recovery entry point, recovery-confirmation state, and a dedicated password-update route. The recovery flow should send a Supabase password-reset email to a redirect URL under the deployed Vercel domain, detect the recovery session, require a new password plus confirmation, and remove the recovery state after success.

Add Google sign-in as a second explicit account option. Before enabling it in the UI, configure the Google Cloud consent screen and OAuth client, then enter the exact callback URL shown by Supabase into Google’s provider settings. The browser will use Supabase OAuth with a Vercel-domain return URL. Maintain email/password sign-in so users do not depend on Google. Add clear errors for existing accounts that try a different sign-in method and a linking policy for matching verified email addresses.

| Account screen | Required behavior |
|---|---|
| Sign-in dialog | Email/password, Google button, “Forgot password?” link, safe error messages, loading state |
| Forgot-password page/dialog | Email input, generic anti-enumeration success confirmation, resend cooldown |
| Reset-password route | Validates recovery session, collects new password, confirms update, returns to account area |
| Account settings | Display name, unique handle, bio, avatar, location visibility, leaderboard opt-in, public-profile switch, connected login methods, sign-out |

### Solo journey and account hub

Evolve the current `/journey` page into the signed-in Pilot Log while retaining its existing map/history functionality. Split navigation into **Overview**, **Solo Journey**, **Co-Focus**, **Achievements**, and **Settings**. Solo current location uses the authoritative location-event stream; the home airport remains a separate preference and is not shown as current location.

The Overview should show virtual solo location, total completed solo focus time, completed solo flights, solo streak, total Explorer distance, longest completed solo flight, pilot-since date, and a compact summary of group participation. No incomplete session should contribute to landed-flight totals.

### Rooms and Co-Focus experience

Replace the current Co-Focus placeholder with a room directory and room detail routes. The entry flow supports creating a room, joining through an invite code/link, listing existing rooms, and leaving a room. Room owners manage the room name and invitations; membership changes apply naturally to future group flights, while active flight snapshots stay stable.

Within a room, show a minimal flight board: chosen origin/destination, all room members’ ready/presence status, the shared route map, session timer, pause reason, and clear participant state. The flight only becomes active when all current room members are ready and present. If someone becomes absent, show a precise “Waiting for [name]” pause state; if all become absent, close the session as abandoned. Members can rejoin an alive paused session without losing accumulated active progress.

After a completed group session, show the private Group Flight Log and the optional sync card only to each qualifying user. The card copy must read **“Set my solo location to BLR”** and explain that it is a manual update based on this completed group flight, not a solo flight completion. It must never interrupt an active flight or show a forced modal.

### Public profiles, friends, and social safety

Add public pilot routes such as `/u/:handle`. A profile header contains display name, handle, optional avatar, optional bio, pilot-since date, allowed virtual location, visible stats, and global rank when opted in. Public visitors can discover a user by handle; search results return identity and an opt-in rank only.

Friendship unlocks detail rather than basic identity. Friends can see the sections explicitly selected for friends-only visibility: Journey map, detailed completed-flight log, achievement list, room summary, and granular statistics. Room names, invite codes, and any unapproved member details remain private. All privacy choices must have accessible labels, explanatory copy, and conservative defaults.

### Leaderboards and achievements

Build a dedicated `/leaderboards` route with tabs for **Solo Focus** and **Co-Focus**, each offering **This Month** and **All Time** views. The default is Monthly Solo Focus. Rows show shared rank, pilot identity, completed focus time, completed flights, and an optional movement/trend indicator when a previous-period snapshot exists. Explorer distance is displayed as a profile statistic and optional dedicated board, never mixed into focus-time ranking.

Add achievements after reliable event recording exists. Start with transparent, non-random milestones: first solo landing, 10/50/100 completed solo flights, first completed co-focus flight, 10/100 focus hours, first room created, and streak milestones. Every award must be idempotent and tied to a criteria version so future changes do not duplicate badges.

### SEO and public acquisition

The authenticated product routes should remain private/noindex where appropriate. Acquisition should come from genuinely useful public pages, not from indexing users’ personal flight logs. Create crawlable, accessible static or prerendered pages for the product landing experience and relevant informational content, such as a Pomodoro timer guide, focus-session planning guide, and how FocusFlight’s flight metaphor works. All copy and imagery must remain original and must not reproduce competitor proprietary assets or wording.

| SEO work item | Implementation outcome |
|---|---|
| Title, description, canonical URL, Open Graph, and social-card metadata | Unique per public route; explains FocusFlight as an original Pomodoro/focus timer |
| Structured data | `SoftwareApplication`/`WebApplication` and FAQ structured data only where page content supports it |
| Technical crawlability | `robots.txt`, generated `sitemap.xml`, correct canonical tags, durable 404 page, noindex for account/private routes |
| Public content | Search-focused pages with clear task value, readable text before optional map enhancement, internal links to the tool |
| Performance/accessibility | Lazy-load heavy map assets on content routes, semantic headings, labels, keyboard support, contrast, mobile checks |
| Search measurement | Verify the Vercel domain in Google Search Console, submit sitemap, monitor indexing, Core Web Vitals, and search queries |

Use static prerendering for known public marketing/content routes while retaining the existing Vite client application for the authenticated app. This is the lowest-risk path for the current Vercel static deployment. Evaluate server-side rendering only if public route count, dynamic content, or social preview requirements outgrow static prerendering.

## Phased implementation plan

### Phase 0 — Product specification, migration design, and safety baseline

Document the state machines, permission matrix, visibility matrix, social-blocking behavior, UTC period policy, and error/empty-state copy before any schema work. Create a backup/export and a migration rehearsal against a non-production Supabase environment. Confirm Vercel Production and Preview variables remain configured without committing credentials.

Acceptance criteria: the team has a table-by-table migration map; every state-changing action has an owner, preconditions, resulting status, and idempotency rule; and no existing solo trip is reclassified or lost.

### Phase 1 — Account, profile, and solo-location foundation

Extend the Supabase profile schema and current persistence library. Add handles, privacy settings, leaderboard opt-in, solo-location cache, location events, and solo-location versioning. Migrate historic completed solo arrivals. Update the solo-flight start/completion path so a new start invalidates pending offers and a completion creates an authoritative arrival event.

Implement password recovery/reset screens, email wording, safe generic confirmations, and Google OAuth support after the provider configuration is ready. Expand the private account/settings screen with privacy controls and profile identity fields.

Acceptance criteria: old account data remains visible; a completed solo flight updates current location exactly once; an abandoned or resumed flight does not; an account can reset a password; and email/password and Google sign-in sessions establish the same profile record safely.

### Phase 2 — Persistent rooms and authoritative group-flight lifecycle

Add rooms, membership, invite flows, sessions, participant snapshots, and server-authoritative lifecycle functions. Integrate Supabase Realtime Presence for the room flight board and reconcile presence changes with the persisted session state. Add robust recovery after refresh/reconnect and clear status copy for boarding, active, waiting, completed, and abandoned states.

Acceptance criteria: a room cannot start with a subset; every member must be present to progress; departure pauses without consuming active time; all-absent closes the session as abandoned; rejoining restores an alive session; and a completed group session writes participant history without changing any solo location.

### Phase 3 — Manual sync offers and group history

Generate per-member offers when a group session completes and the individual’s current solo location matches the group origin. Add the group-history tab, completed group route map, and room-dashboard sync card. Implement the new-solo-flight invalidation rule and the acceptance function with atomic version/origin validation.

Acceptance criteria: two completed CCU-origin group flights can create two distinct offers; starting a new solo flight invalidates both; accepting one valid offer updates solo location once; competing offers remain auditable but become unavailable if the origin condition no longer holds; and no group path appears in the solo map unless a manual sync event is accepted.

### Phase 4 — Public pilots, friendships, and privacy enforcement

Create public pilot routes, handle lookup, friend request/accept/decline/cancel flows, canonical friendships, blocking, and friend-gated profile sections. Build secure public/friends-only database views and test RLS directly. Add interface controls to set profile visibility, location visibility, leaderboard participation, and section-level sharing preferences.

Acceptance criteria: unauthenticated visitors see only allowed public identity; friends see only permitted extra details; blocked users cannot request, invite, query friends-only content, or infer hidden locations; and users can opt out of rankings while leaving their profile public.

### Phase 5 — Leaderboards, achievements, and activity summaries

Implement aggregate calculations from completed events, monthly/all-time period queries, shared-rank tie handling, Solo Focus/Co-Focus separation, and leaderboard opt-out. Add badges after completion events are proven stable. Build a compact ranking card for the profile and full leaderboard pages with explicit empty, loading, opt-out, and tie states.

Acceptance criteria: incomplete/abandoned flights have zero ranking effect; solo and group time never mix on their boards; monthly ranking changes by UTC calendar month without a destructive reset; equal scores share rank; achievement events do not duplicate after retries; and privacy constraints hold in every ranking query.

### Phase 6 — SEO, content, performance, and launch readiness

Implement metadata, static/prerendered public pages, sitemap, robots policy, structured data, canonical handling, and social previews. Improve Lighthouse/accessibility performance, with map loading deferred where it does not serve the public content purpose. Configure Google Search Console and submit the sitemap after deployment.

Acceptance criteria: public pages have meaningful distinct metadata and server-visible text; private/account routes are excluded from indexing; sitemap URLs resolve successfully; mobile and keyboard usage pass review; and the Vercel build/deployment succeeds without exposing any secret.

### Phase 7 — Production verification and rollout

Run staged production verification: start with staff/test accounts, then a small room with multiple test members, then the public profile and leaderboard release. Record audit events and errors without logging passwords, tokens, or private location values. Commit only reviewed changes, push to GitHub `main`, and rely on Vercel’s linked deployment; validate the live deployment after each release phase.

Acceptance criteria: all automated tests pass, migration rollback/forward paths are documented, Vercel production renders correctly, Supabase auth redirects work, and the release checklist is signed off.

## Test strategy

Testing must be comprehensive because this feature set involves race conditions, privacy, and state transitions.

| Test layer | Coverage |
|---|---|
| Unit tests | Solo completion/location event behavior; UTC streak calculation; monthly period keys; rank ties; sync eligibility; offer invalidation; room-session state machine; duration and route utilities |
| Database/RLS integration tests | Owner versus stranger reads; public profile sanitizer; friendship and block rules; room membership; cross-user write denial; atomic sync and group-completion functions |
| Realtime integration tests | Presence loss pauses a flight; complete roster resumes it; all absent abandons it; reconnect recovers session state without double-counting time |
| End-to-end browser tests | Sign-up, password reset, Google sign-in callback in a configured test project, solo completion, room creation/join/start/pause/rejoin/abandon/complete, sync offer, privacy settings, friends, blocking, and leaderboards |
| SEO and accessibility checks | Metadata snapshots, sitemap/robots assertions, public no-JavaScript content presence, noindex private routes, keyboard flow, contrast, screen-reader labels, mobile layout, and performance budget |
| Manual production checks | Vercel environment settings, Supabase redirect URLs, email delivery/template behavior, Google OAuth consent, Vercel preview access, multi-browser room test, and Google Search Console verification |

## Rollout safeguards and risks

| Risk | Mitigation |
|---|---|
| Client manipulation of timers/ranks | Only server-authoritative database functions may complete sessions, create stats, or update location events |
| Presence disconnects causing unfair progress | Persist active elapsed time and pause on server-confirmed roster absence; reconcile reconnects idempotently |
| Social privacy leak | Use RLS-backed views/functions, not UI-only filtering; add negative-access tests for every privacy mode |
| Migration breaks existing journeys | Rehearse on a copy, use additive columns/tables, backfill deterministically, and preserve legacy trip IDs |
| OAuth misconfiguration | Configure exact Supabase/Google/Vercel redirect chain in a staging environment before exposing the Google button |
| Search expectations | Treat SEO as long-term acquisition work; monitor Search Console rather than promising immediate ranking results |
| Group-room complexity | Release rooms before leaderboard/social depth, with explicit state-machine tests and narrow invite rules |
| Abuse/spam | Request cooldowns, rate limits, block feature, audit records, and invite controls from the first social release |

## Assumptions and questions to confirm before implementation

This plan assumes the current Vercel production domain is `https://project-waypoint-app.vercel.app`, Supabase remains the Tokyo project already used by Waypoint, and GitHub `main` remains the production deployment branch. It also assumes the production app will keep English as its user-facing language.

| Topic | Proposed default | Confirmation needed before build |
|---|---|---|
| Room capacity | Start with a modest cap such as 10 members per room | Confirm desired maximum and whether larger rooms are a paid/advanced feature |
| Room ownership | Creator is owner; owner can invite/manage, but all members are required for a flight | Confirm whether ownership transfer and co-owners are needed in the first release |
| Active-session membership changes | Membership snapshot determines an active flight; new invites/removals affect the next session | Confirm how a room owner removing a member during an active session should behave |
| Group timer start | Room creator starts after all members are ready/present | Confirm whether any ready member may start instead |
| Group-session history visibility | Visible to the participant privately; public/friend exposure remains user-controlled | Confirm whether room members should see one another’s individual group history entries |
| Profile default location visibility | `shared_rooms` or `only_me` recommended | Confirm preferred default; public remains an opt-in choice |
| Avatar storage | Optional upload with safe type/size limits, initials fallback | Confirm whether external avatar URLs are allowed or upload only |
| Google OAuth | Email/password remains supported alongside Google | Provide/authorize Google Cloud OAuth configuration when Phase 1 begins |
| Public content | Original informational pages around Pomodoro/focus planning | Confirm desired editorial voice and whether the user will supply articles or wants original drafts |

## Definition of done

The release is complete only when the production Vercel app supports a secure password reset and Google sign-in, retains correct solo location behavior, provides rooms with authoritative all-members presence logic, preserves separate group history, generates valid optional sync offers, enforces privacy and social rules in Supabase, ranks completed focus time correctly in separate Solo/Co-Focus monthly and all-time boards, renders public profiles according to visibility settings, and exposes original crawlable SEO content with a valid sitemap and measured production checks.
