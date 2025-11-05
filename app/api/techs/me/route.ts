// app/api/tech/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await supabaseServer();

  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id || null;
  if (!uid) return NextResponse.json({ technician_id: null });

  const { data: techByUser } = await sb
    .from("technicians")
    .select("id, user_id, active")
    .eq("user_id", uid)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (techByUser?.id) {
    return NextResponse.json({ technician_id: techByUser.id });
  }

  const { data: prof } = await sb
    .from("profiles")
    .select("id, role")
    .eq("id", uid)
    .maybeSingle();

  if (prof?.role === "TECH") {
    return NextResponse.json({ technician_id: prof.id });
  }

  return NextResponse.json({ technician_id: null });
}
