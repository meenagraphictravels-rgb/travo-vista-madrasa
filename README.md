# Travo Vista Group - Web Online Version

Existing Electron UI/features are kept as the base. The web version adds Supabase Auth and online per-organization data sync.

1. Create a Supabase project and run `supabase.sql` in SQL Editor.
2. Put the Supabase Project URL and anon/publishable key in `supabase-config.js`.
3. Host this folder as a static site (Render Static Site / Cloudflare Pages / GitHub Pages).
4. Use email/password for online registration/login.
5. Never put the Supabase service-role key in browser code.

The app keeps a browser cache and syncs changes to the logged-in organization's `app_data` row, allowing the existing synchronous UI code to remain largely unchanged.
