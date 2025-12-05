// app/api/tech/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await supabaseServer();

  // who is logged in?
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id || null;
  if (!uid) return NextResponse.json({ technician_id: null });

  // try technicians.user_id linkage first
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

  // fallback: if you're still using profiles as TECH identity,
  // allow the profile id to stand in for a technician id (legacy).
  const { data: prof } = await sb
    .from("profiles")
    .select("id, role")
    .eq("id", uid)
    .maybeSingle();

  if (prof?.role === "TECH") {
    // Legacy: treat profile id as technician id (works with your earlier fallback).
    return NextResponse.json({ technician_id: prof.id });
  }

  return NextResponse.json({ technician_id: null });
}



