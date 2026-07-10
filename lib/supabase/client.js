"use client";

// Browser-side Supabase client — safe to use with the anon/publishable key,
// RLS is what actually protects the data (see supabase/schema.sql).
import { createBrowserClient } from "@supabase/ssr";

let browserClient;

export function supabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return browserClient;
}
