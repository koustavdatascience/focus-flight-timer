# Project Waypoint Authentication-Origin Transition

## Confirmed configuration

On 15 August 2026, the production authentication origin was moved to:

```text
https://project-waypoint-app.vercel.app
```

The Supabase Authentication **Site URL** now uses this address. The following Redirect URLs are allowed during the migration:

```text
https://project-waypoint-app.vercel.app/**
https://focus-flight-timer.vercel.app/**
```

The previous Vercel address is deliberately retained temporarily so existing password-recovery and OAuth links are not interrupted. It may be removed only after production sign-in, password recovery, Google OAuth, and external links have been rechecked on the new address.

## Google OAuth configuration

Confirm in Google Cloud Console that `https://project-waypoint-app.vercel.app` is listed under the OAuth client’s Authorized JavaScript origins. Keep the stable Supabase callback URI unchanged:

```text
https://pxicdashfmnqpobahify.supabase.co/auth/v1/callback
```

## Google Cloud inspection finding

The connected Google Cloud project displayed as `focus flight 2` on 15 August 2026 showed no OAuth 2.0 client IDs. The existing Google sign-in configuration may therefore be owned by a different Google Cloud project or account.

## Replacement OAuth project

With owner confirmation, a new Google Cloud project named **Project Waypoint** was created on 15 August 2026 with project ID `project-waypoint-505612`. OAuth consent-screen configuration is being established with the public application name **Waypoint**, the user-supplied support address `koustavdatascience@gmail.com`, and the **External** audience type. The app will begin in testing mode and must have appropriate test users added before use by other Google accounts. A replacement web client must retain the stable Supabase callback URI above and add `https://project-waypoint-app.vercel.app` as an authorized JavaScript origin before its credentials are placed in Supabase.

## Replacement OAuth web client

The replacement web client, **Project Waypoint Web**, was created in the Project Waypoint Google Cloud project on 15 August 2026. Its Client ID is `587119112003-b78jojhtqsimsih50j8gi501ih08v8hv.apps.googleusercontent.com`. It has `https://project-waypoint-app.vercel.app` as its authorized JavaScript origin and the stable Supabase callback URI as its authorized redirect URI. A replacement client secret was generated for secure transfer into Supabase; the secret value is not recorded in this repository or documentation.

The replacement Client ID and newly generated Client Secret were saved in Supabase's enabled Google provider configuration on 15 August 2026. The Supabase dashboard confirmed the provider-settings update. The Google consent screen remains in External testing mode; additional intended Google accounts must be added as test users until the consent screen is published.

Live Google sign-in was verified on 15 August 2026 at `https://project-waypoint-app.vercel.app/`. The approved test account completed the Google account-selection flow and returned to the new production address in an authenticated Waypoint session. No account identifiers, session values, or OAuth secrets are recorded here.

Live password recovery was also completed on 15 August 2026 at `https://project-waypoint-app.vercel.app/`. The recovery flow reached the new production address, accepted a replacement password, and returned to an authenticated Waypoint session. No account identifiers, password values, session values, or reset tokens are recorded here.
