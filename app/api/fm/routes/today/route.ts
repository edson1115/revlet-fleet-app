// app/api/fm/routes/today/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Haversine distance in miles */
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8; // Earth radius in miles
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function GET() {
  const supabase = await supabaseServer();

  // Load today's route stops
  const { data, error } = await supabase
    .from("fm_route_stops")
    .select(
      `
        id,
        order_index,
        customers:customer_id (
          id,
          name,
          lat,
          lng,
          address
        ),
        request:request_id (
          id,
          status,
          vehicle:vehicle_id (
            id,
            year,
            make,
            model,
            plate
          )
        )
      `
    )
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Normalize all relational arrays → single objects
  const stops = (data ?? []).map((row: any) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const request = Array.isArray(row.request) ? row.request[0] : row.request;

    return {
      ...row,
      customers: customer ?? null,
      request: request ?? null,
    };
  });

  // If no geolocation for first item, just return ordered list
  const first = stops.find((s) => s.customers?.lat && s.customers?.lng);

  if (!first) {
    return NextResponse.json({ stops });
  }

  // Start point for distance sorting
  let current = {
    lat: Number(first.customers.lat),
    lng: Number(first.customers.lng),
  };

  const sorted: any[] = [];
  const remaining = [...stops];

  while (remaining.length) {
    // Pick nearest stop
    remaining.sort((a, b) => {
      const ca = a.customers ?? {};
      const cb = b.customers ?? {};

      const da = haversine(current, {
        lat: Number(ca.lat ?? current.lat),
        lng: Number(ca.lng ?? current.lng),
      });

      const db = haversine(current, {
        lat: Number(cb.lat ?? current.lat),
        lng: Number(cb.lng ?? current.lng),
      });

      return da - db;
    });

    const next = remaining.shift()!;
    sorted.push(next);

    if (next.customers?.lat && next.customers?.lng) {
      current = {
        lat: Number(next.customers.lat),
        lng: Number(next.customers.lng),
      };
    }
  }

  return NextResponse.json({ stops: sorted });
}
