import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Handle auth redirect from email/OAuth — session is in the URL fragment,
// exchange it for a session cookie so Server Components see auth.uid().
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${new URL(request.url).origin}/auth?error=auth_error`);
    }
  }

  // Redirect to onboarding wizard
  return NextResponse.redirect(`${new URL(request.url).origin}/onboard`);
}
