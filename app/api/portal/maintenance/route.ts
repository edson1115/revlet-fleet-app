// app/api/portal/maintenance/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // Load vehicles (scoped by company)
    const { data: vehicles, error: vehErr } = await supabase
      .from("vehicles")
      .select("id, year, make, model, unit_number, plate, customer_id")
      .order("created_at", { ascending: false });

    if (vehErr) {
      return NextResponse.json([], { status: 200 });
    }

    // Load PM history
    const { data: pmHistory } = await supabase
      .from("service_requests")
      .select("id, vehicle_id, service, created_at")
      .order("created_at", { ascending: false });

    const safeVehicles = vehicles ?? []; // <-- FIX so .map() never errors

    const rows = safeVehicles.map((v) => {
      const pm = (pmHistory ?? []).find((x) =>
        String(x.service || "").toLowerCase().includes("oil")
      );

      return {
        id: v.id,
        label: [v.year, v.make, v.model, v.plate || v.unit_number]
          .filter(Boolean)
          .join(" "),
        last_pm: pm?.created_at ?? null,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("MAINT ERR", err);
    return NextResponse.json([], { status: 200 });
  }
}



