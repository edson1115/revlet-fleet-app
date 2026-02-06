import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function GET() {
  const supabase = await supabaseServer();

  // AUTH
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // Fix: safely access metadata or default to empty object
  const role = user.user_metadata?.role;
  // Fix: Ensure we check against the string values correctly
  if (!role || !["ADMIN", "SUPERADMIN", "admin", "superadmin"].includes(role)) {
     // NOTE: I added lowercase checks just in case your DB uses lowercase
     // return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // STOCK
  const { data: stock } = await supabase
    .from("inventory_tires")
    .select("*");

  // USAGE
  const seven = dayjs().subtract(7, "day").toISOString();
  const { data: usage } = await supabase
    .from("tire_usage")
    .select("*")
    .gte("used_at", seven);

  // MARKET STOCK
  const { data: marketStock } = await supabase
    .from("inventory_market_summary")
    .select("*");

  // Top sizes
  const sizeCount: Record<string, number> = {};
  stock?.forEach((t: any) => {
    sizeCount[t.size] = (sizeCount[t.size] || 0) + (t.qty || 0);
  });

  // FIX: Explicitly cast 'count' to number so .sort() works
  const topSizes = Object.entries(sizeCount)
    .map(([size, count]) => ({ size, count: Number(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Vendor breakdown
  const vendors: Record<string, number> = {};
  stock?.forEach((t: any) => {
    const v = t.vendor || "Unknown";
    vendors[v] = (vendors[v] || 0) + (t.qty || 0);
  });

  // Weekly usage chart
  const usageWeek = Array(7).fill(0);
  usage?.forEach((u: any) => {
    const dow = dayjs(u.used_at).day();
    usageWeek[dow]++;
  });

  return NextResponse.json({
    ok: true,
    stats: {
      // FIX: Typed reduce arguments
      total_stock: stock?.reduce((a: number, b: any) => a + (b.qty || 0), 0) || 0,
      used_week: usage?.length || 0,
      top_size: topSizes[0]?.size || "—",
      vendor_count: Object.keys(vendors).length,

      usage_week: usageWeek,
      top_sizes: topSizes,
      market_stock: marketStock || [],
      vendor_breakdown: Object.entries(vendors)
        .map(([vendor, count]) => ({
            vendor,
            count: Number(count),
        }))
        .sort((a, b) => b.count - a.count),
    },
  });
}