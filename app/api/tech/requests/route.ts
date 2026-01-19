import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    // 1. Auth & Role Check
    if (!scope.uid || scope.role !== "TECH") {
      return NextResponse.json(
        { error: "Forbidden — tech only" },
        { status: 403 }
      );
    }

    // 2. Fetch Active Jobs (Lead OR Buddy)
    const { data: requests, error } = await supabase
      .from("service_requests")
      .select(`
        id,
        status,
        created_at,
        service_title,
        scheduled_start_at,
        plate,
        customer:customers(id, name, address, phone),
        vehicle:vehicles(id, year, make, model, plate, unit_number),
        request_parts(id, part_name, part_number, quantity)
      `)
      .or(`technician_id.eq.${scope.uid},second_technician_id.eq.${scope.uid}`) // ✅ Buddy Logic
      .in("status", ["SCHEDULED", "IN_PROGRESS", "WAITING_PARTS"])
      .order("scheduled_start_at", { ascending: true });

    if (error) {
      console.error("Tech requests error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, requests: requests || [] });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}