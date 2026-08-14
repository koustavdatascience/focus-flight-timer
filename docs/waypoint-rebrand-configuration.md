# Waypoint rebrand configuration checklist

## What changed in the repository

The application’s visible product identity, browser metadata, structured data, public pages, guides, legal drafts, and README now use **Waypoint**. Existing user data, Supabase tables, migration history, and internal helper identifiers retain their prior names so the rebrand does not disrupt authentication, trips, social data, or existing deployment configuration.

## Current configured identifiers

| Identifier | Current state |
|---|---|
| `project-waypoint` GitHub repository | Public repository renamed on 14 August 2026; GitHub preserves redirects from the prior repository URL. |
| `https://project-waypoint-app.vercel.app/` | Assigned Project Waypoint Vercel production address and current canonical origin. |
| `https://focus-flight-timer.vercel.app/` | Retained temporarily as a legacy Vercel deployment address during the authentication and search transition. |
| Supabase project reference and database/RPC identifiers | Intentionally unchanged to preserve production data and application behavior. |
| Google OAuth callback URI | The stable Supabase callback remains `https://pxicdashfmnqpobahify.supabase.co/auth/v1/callback`. |

## Owner-managed follow-up

## Remaining owner-managed follow-up

1. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://project-waypoint-app.vercel.app` and add `https://project-waypoint-app.vercel.app/**` as an allowed redirect URL. Retain the old Vercel address during transition.
2. In Google Cloud’s OAuth client, add `https://project-waypoint-app.vercel.app` under Authorized JavaScript origins. Keep the Supabase callback URI unchanged.
3. Rename the Google OAuth consent-screen application to **Waypoint**, then verify the public app display name and support contact.
4. Verify the new address in Google Search Console, submit `https://project-waypoint-app.vercel.app/sitemap.xml`, and request re-indexing of primary public routes.
5. When a custom Waypoint domain is selected, repeat the canonical, sitemap, robots, Supabase, Google OAuth, and Search Console steps for that domain before retiring Vercel aliases.

## Validation boundary

After any domain migration, test email recovery, Google sign-in, canonical URLs, sitemap accessibility, and a full landing-to-completed-flight flow before retiring the old Vercel origin.
