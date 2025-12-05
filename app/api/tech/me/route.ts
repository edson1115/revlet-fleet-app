// app/api/tech/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = await supabaseServer();

    const { data: auth } = await sb.auth.getUser();
    const uid = auth.user?.id || null;
    if (!uid) return NextResponse.json({ technician_id: null, role: null }, { status: 401 });

    // Prefer your profiles table for role
    const { data: prof } = await sb
      .from("profiles")
      .select("id, role")
      .eq("id", uid)
      .maybeSingle();

    // Try technicians.user_id linkage first
    const { data: techByUser } = await sb
      .from("technicians")
      .select("id, user_id, active")
      .eq("user_id", uid)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (techByUser?.id) {
      return NextResponse.json({ technician_id: techByUser.id, role: prof?.role ?? null });
    }

    // Legacy fallback: TECH role uses profile id as tech id
    if (prof?.role === "TECH") {
      return NextResponse.json({ technician_id: prof.id, role: prof.role });
    }

    return NextResponse.json({ technician_id: null, role: prof?.role ?? null });
  } catch (e: any) {
    console.error("[GET /api/tech/me]", e);
    return NextResponse.json({ technician_id: null, role: null, error: e.message }, { status: 500 });
  }
}



