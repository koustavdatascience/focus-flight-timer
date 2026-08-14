# Google OAuth setup status

## Verified status — 14 August 2026

The FocusFlight Supabase project (`pxicdashfmnqpobahify`) now lists the **Google** authentication provider as **Enabled**. A production sign-in test confirmed that a user can select a Google account, return to FocusFlight, and receive an active authenticated session.

## Required configuration

1. In Google Cloud Console, create or select an OAuth 2.0 Web application client for FocusFlight.
2. Add `https://pxicdashfmnqpobahify.supabase.co/auth/v1/callback` as its Google **Authorized redirect URI**.
3. In Supabase **Authentication → Sign In / Providers → Google**, enable the provider and enter the Google OAuth client ID and client secret.
4. In Supabase **Authentication → URL Configuration**, ensure the production application URL and relevant development/preview return URLs are listed as allowed redirect URLs. The production URL is `https://focus-flight-timer.vercel.app/`.
5. Complete a normal user sign-in to verify the browser returns to FocusFlight with an active Supabase session.

## Configuration incident resolved

The initial provider configuration was blocked first because Google was disabled, then because an incomplete client secret was saved. A fresh Google OAuth web client was configured with the exact production origin and Supabase callback URL, and its complete credentials were saved directly in Supabase. Supabase authentication logs confirmed the earlier `invalid_client` exchange error; a subsequent user validation confirmed the corrected flow works. No credential value is stored in this repository.

> Never commit the Google OAuth client secret to the repository or paste it into public issue threads.
