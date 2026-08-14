# Waypoint rebrand configuration checklist

## What changed in the repository

The application’s visible product identity, browser metadata, structured data, public pages, guides, legal drafts, and README now use **Waypoint**. Existing user data, Supabase tables, migration history, and internal helper identifiers retain their prior names so the rebrand does not disrupt authentication, trips, social data, or existing deployment configuration.

## Deliberately unchanged identifiers

| Identifier | Why it remains unchanged |
|---|---|
| `focus-flight-timer` GitHub repository and package identifier | Preserves the established repository, Vercel integration, and release history. |
| `https://focus-flight-timer.vercel.app/` | Remains the live canonical origin until a Waypoint domain is purchased and connected. |
| Supabase project reference and database/RPC identifiers | Preserves production data and application behavior. |
| Google OAuth callback URI | The stable Supabase callback remains `https://pxicdashfmnqpobahify.supabase.co/auth/v1/callback`. |

## Owner-managed follow-up

When a custom Waypoint domain is selected, complete these changes together:

1. Add and verify the domain in Vercel, then make it the production domain.
2. Update the canonical origin in `client/src/services/seo.ts`, `client/public/sitemap.xml`, `client/public/robots.txt`, `client/index.html`, and this README only after the domain is live.
3. In Supabase **Authentication → URL Configuration**, set the new Site URL and add `<new-domain>/**` as an allowed redirect URL while retaining the current Vercel URL during transition.
4. In Google Cloud’s OAuth client, add `https://<new-domain>` under Authorized JavaScript origins. Keep the Supabase callback URI unchanged.
5. Rename the Google OAuth consent-screen application to **Waypoint**, then verify the public app display name and support contact.
6. Verify the new domain in Google Search Console, submit the new sitemap, and request re-indexing of primary public routes.

## Validation boundary

After any domain migration, test email recovery, Google sign-in, canonical URLs, sitemap accessibility, and a full landing-to-completed-flight flow before retiring the old Vercel origin.
