// app/api/access-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // ✅ FIX: await the server client
  const sb = await supabaseServer();

  const { data, error } = await sb
    .from("access_requests")
    .insert({
      email: body.email,
      name: body.name ?? null,
      company_name: body.company_name ?? null,
      requested_role: body.requested_role ?? null,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
