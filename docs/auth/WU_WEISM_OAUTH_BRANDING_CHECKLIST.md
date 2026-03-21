# Wu-Weism OAuth Branding Checklist

This repo brands the app-owned authentication flow, but Google account chooser branding still depends on provider configuration outside the codebase.

## Required Human Follow-Up

### Google Cloud OAuth consent

Update the OAuth app that backs Supabase Google sign-in with:

- App name: `Wu-Weism`
- App logo: square Wu-Weism mark
- Support email: production support address
- App domain: production marketing domain
- Homepage URL: production landing page
- Privacy policy URL: production privacy page
- Terms of service URL: production terms page

## Supabase Auth provider

In Supabase Auth settings:

- confirm Google is the active provider
- confirm the Google client ID and secret belong to the Wu-Weism OAuth app
- confirm the redirect URL includes `/auth/callback`
- remove any stale product labels that still read like raw infrastructure or old product naming

## Custom auth domain

If a custom auth-facing domain is available, configure it so users do not see the raw `*.supabase.co` host as the primary continuation target.

Suggested pattern:

- marketing/product: `wuweism.ai`
- auth: `auth.wuweism.ai`

After DNS and provider changes:

- add the custom auth domain in Supabase
- update Google authorized redirect URIs
- verify the production callback still resolves to `/auth/callback`

## Asset Pack

Use one compact mark consistently across:

- browser icon / app icon
- Google OAuth consent logo
- auth airlock header
- social preview image

Current in-repo asset used by auth and metadata:

- `/public/wu-wei-mark-true-alpha.png`

## Verification

After configuration changes:

1. Open the signed-out landing page and click `Try Wu-Weism`.
2. Confirm `/auth` shows Wu-Weism branding before redirect.
3. Start Google sign-in and confirm the OAuth screen shows Wu-Weism app naming/logo where Google supports it.
4. Confirm the visible continuation domain is the intended product or auth domain.
5. Complete sign-in and confirm the branded return transition lands back in the requested app route.
