import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const timeframe = Number(url.searchParams.get("time") || 90);

  const supabase = await supabaseServer();

  // Leads
  const { data: leads } = await supabase
    .from("sales_leads")
    .select("id, lat, lng, status, created_at");

  // Customers
  const { data: customers } = await supabase
    .from("customers")
    .select("id, lat, lng, total_spend, last_visit_at");

  // Combine & score
  const points: any[] = [];

  // Lead scoring
  for (const l of leads || []) {
    points.push({
      lat: l.lat,
      lng: l.lng,
      weight: l.status === "CONVERTED" ? 0.8 : 0.4,
    });
  }

  // Customer scoring
  for (const c of customers || []) {
    points.push({
      lat: c.lat,
      lng: c.lng,
      weight:
        c.total_spend > 10000
          ? 1
          : c.total_spend > 5000
          ? 0.7
          : 0.4,
    });
  }

  return NextResponse.json({
    ok: true,
    points,
  });
}
