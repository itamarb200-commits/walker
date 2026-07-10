import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Persist/drop a push subscription for the signed-in user. Family scoping
// comes from the user's own persons row — no service role needed here,
// RLS (push_subs_all: user_id = auth.uid()) is the real guard.

export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: person } = await supabase
    .from("persons")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!person) return NextResponse.json({ error: "not onboarded" }, { status: 400 });

  const sub = await req.json();
  if (!sub?.endpoint) return NextResponse.json({ error: "invalid subscription" }, { status: 400 });

  const { error } = await supabase.from("push_subs").upsert(
    {
      family_id: person.family_id,
      user_id: user.id,
      endpoint: sub.endpoint,
      sub_json: sub,
    },
    { onConflict: "endpoint" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "missing endpoint" }, { status: 400 });

  const { error } = await supabase.from("push_subs").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
