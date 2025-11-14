// app/api/lookups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const url = new URL(req.url);

    const type = url.searchParams.get("type");
    const location_id = url.searchParams.get("location_id");
    const customer_id = url.searchParams.get("customer_id");

    if (!type) {
      return NextResponse.json(
        { error: "Missing 'type' query param" },
        { status: 400 }
      );
    }

    /* ---------------- LOCATIONS ---------------- */
    if (type === "locations") {
      // These are the locations we actually want to show in the UI
      const keep = ["San Antonio", "Dallas", "Bay Area", "Sacramento", "Washington"];

      const { data, error } = await supabase
        .from("company_locations")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("[lookups] locations error:", error);
        return NextResponse.json(
          { error: "Failed to load locations" },
          { status: 500 }
        );
      }

      // Filter to allowed names + dedupe by name
      const seen = new Set<string>();
      const filtered: { id: string; name: string }[] = [];

      for (const loc of (data || []) as { id: string; name: string }[]) {
        if (!loc?.name) continue;
        if (!keep.includes(loc.name)) continue;

        if (seen.has(loc.name)) continue; // prevent duplicates
        seen.add(loc.name);

        filtered.push({ id: loc.id, name: loc.name });
      }

      return NextResponse.json({ data: filtered });
    }

    /* ---------------- CUSTOMERS ---------------- */
    if (type === "customers") {
      // Your `customers` table does NOT have `location_id` (per error 42703),
      // so we only select (id, name) and ignore location filtering for now.
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("[lookups] customers error:", error);
        return NextResponse.json(
          { error: "Failed to load customers" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: data ?? [] });
    }

    /* ---------------- VEHICLES ---------------- */
    if (type === "vehicles") {
      let query = supabase
        .from("vehicles")
        .select("id, label, vin, plate, customer_id, location_id")
        .order("label", { ascending: true });

      if (customer_id) {
        query = query.eq("customer_id", customer_id);
      }
      if (location_id) {
        // Keep this only if `vehicles.location_id` exists in your schema
        query = query.eq("location_id", location_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[lookups] vehicles error:", error);
        return NextResponse.json(
          { error: "Failed to load vehicles" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: data ?? [] });
    }

    /* ---------------- UNKNOWN TYPE ---------------- */
    return NextResponse.json(
      { error: `Unknown lookup type: ${type}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("[lookups] unhandled error:", err);
    return NextResponse.json(
      { error: "Unexpected error in lookups endpoint" },
      { status: 500 }
    );
  }
}
