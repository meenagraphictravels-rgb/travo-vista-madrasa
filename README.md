# Travo Vista Madrasa - Online Foundation

This project starts from the supplied Travo Vista Group Madrasa Management System v3.4 source and keeps its existing UI/modules as the base.

## Current foundation
- Browser/Render-compatible entry point: `index.html`
- Supabase browser configuration: `supabase-config.js`
- Supabase authentication/session layer: `js/online-auth.js`
- Future integration placeholders: `js/future-roadmap.js`
- Fresh database foundation: `supabase.sql`
- Original application source retained as `ORIGINAL_README.md`

## First setup
1. Create a NEW Supabase project.
2. Run `supabase.sql` in SQL Editor.
3. Put the new project URL and browser-safe publishable key into `supabase-config.js`.
4. Add the deployed site URL to Supabase Auth redirect/site URL settings.
5. Run locally with any static server, for example `npx http-server -p 5500`.
6. Test account creation and login before connecting additional modules.

## Planned phases
- Cloud synchronization for all management records (foundation included via `app_data`).
- WhatsApp integration.
- Public online admission form.
- QR code for admission form.
- Payment-gated application submission, with server-side payment verification.
- Subscription/plan enforcement.
- Parent/student portal and automated notifications.

Do not expose a Supabase secret/service_role key in browser files. Payment and WhatsApp provider secrets belong in secure server/Edge Function environment variables.
