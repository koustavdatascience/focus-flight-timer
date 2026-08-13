# FocusFlight on Vercel

## Deployment model

FocusFlight is deployed to Vercel as a **Vite single-page application**. The interactive flight map, airport search, timer, Leaflet/OpenStreetMap tiles, and Supabase-backed authentication and journey history all execute in the browser. The Vercel build must publish `dist/public`, which is the Vite client bundle, rather than the repository's Express development-server bundle.

The root `vercel.json` enforces this model by running `pnpm run build:vercel`, publishing `dist/public`, and rewriting browser routes to `index.html`. The rewrite preserves direct navigation to client-side paths such as `/journey`, as required for a Vite SPA on Vercel.[1]

| Setting | Value | Purpose |
|---|---:|---|
| Framework | `vite` | Uses Vercel's Vite deployment flow. |
| Install command | `pnpm install --frozen-lockfile` | Installs the dependency graph captured in the committed lockfile. |
| Build command | `pnpm run build:vercel` | Creates only the browser bundle with `vite build`. |
| Output directory | `dist/public` | Publishes the generated FocusFlight client assets. |
| Route rewrite | `/(.*)` → `/index.html` | Keeps client-side routes reachable after a refresh or direct visit. |

> The repository also includes an Express/tRPC service used by the Manus development environment. It is deliberately not published by this Vercel static configuration because the shipped FocusFlight experience uses Supabase directly in the browser. If server-only features are added later, introduce a dedicated Vercel Function rather than routing the Express development server into the static output.[1]

## Required Vercel environment variables

Configure the following values in **Vercel → FocusFlight → Settings → Environment Variables** for both **Production** and **Preview**. Use the values from the connected Supabase project's Connect dialog; do not commit them into the repository.

| Variable | Use | Security boundary |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL used by the browser client. | Public client configuration. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by the browser client. | Designed for browser exposure; database access remains constrained by RLS. |

The `VITE_` prefix makes these build-time values available to the Vite client bundle on Vercel.[1] Use only the Supabase **publishable** key here. Supabase documents that secret/service-role keys have elevated privileges, bypass Row Level Security, and must never be exposed to browsers or source control.[3]

## Supabase Auth URL configuration

In **Supabase → Authentication → URL Configuration**, set the Site URL to:

```text
https://focus-flight-timer.vercel.app
```

Add the following additional Redirect URLs to support Vercel preview deployments and local development:

```text
https://*-koustav5.vercel.app/**
http://localhost:3000/**
```

Supabase uses the Site URL when no explicit redirect is supplied, and requires explicit allow-list entries for authentication redirects. Its Vercel guidance recommends an exact production Site URL and a wildcard preview pattern for Vercel preview URLs.[2]

## Verification sequence

After the variables and Supabase URLs are saved, push a commit to `main`. The linked Vercel project will build the Vite client bundle. Verify the following on the production domain:

1. The landing page loads as HTML rather than displaying a JavaScript server bundle.
2. A direct visit to `/journey` renders the FocusFlight client route.
3. Sign-in, email confirmation, profile changes, and trip history use the configured Supabase project.
4. The guest flow supports map interaction, route selection, timer start, and the active-flight path.

## References

[1]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
[2]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase Auth Redirect URLs"
[3]: https://supabase.com/docs/guides/api/api-keys "Understanding Supabase API Keys"
