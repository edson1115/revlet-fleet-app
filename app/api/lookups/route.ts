// app/api/lookups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ data: [] });

    const supabase = supabaseServer();
    const url = new URL(req.url);

    const type = url.searchParams.get("type");
    const customerId = url.searchParams.get("customer_id");
    const locationId = url.searchParams.get("location_id");

    if (!type) {
      return NextResponse.json({ error: "missing_type" }, { status: 400 });
    }

    /* ---------------- LOCATIONS ---------------- */
    if (type === "locations") {
      const keep = ["San Antonio", "Dallas", "Bay Area", "Sacramento", "Washington"];

      const { data, error } = await supabase
        .from("company_locations")
        .select("id, name")
        .order("name");

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const unique: any[] = [];
      const seen = new Set();

      data?.forEach((loc) => {
        if (keep.includes(loc.name) && !seen.has(loc.name)) {
          seen.add(loc.name);
          unique.push(loc);
        }
      });

      return NextResponse.json({ data: unique });
    }

    /* ---------------- CUSTOMERS ---------------- */
    if (type === "customers") {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ data: data || [] });
    }

    /* ---------------- VEHICLES ---------------- */
    if (type === "vehicles") {
      let q = supabase
        .from("vehicles")
        .select("id, label, vin, plate, customer_id, location_id")
        .order("label");

      if (customerId) q = q.eq("customer_id", customerId);
      if (locationId) q = q.eq("location_id", locationId);

      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ data: data || [] });
    }

    return NextResponse.json({ error: "unknown_type" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
