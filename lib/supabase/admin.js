import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. SERVER ONLY: only import this
// from Route Handlers that are themselves gated (e.g. by CRON_SECRET). Never
// import from a Client Component or anything that ships to the browser.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
