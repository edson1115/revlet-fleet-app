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

  const role = user.user_metadata?.role;
  if (!["ADMIN", "SUPERADMIN"].includes(role))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

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
  const sizeCount: any = {};
  stock?.forEach((t) => {
    sizeCount[t.size] = (sizeCount[t.size] || 0) + t.qty;
  });

  const topSizes = Object.entries(sizeCount)
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Vendor breakdown
  const vendors: any = {};
  stock?.forEach((t) => {
    vendors[t.vendor] = (vendors[t.vendor] || 0) + t.qty;
  });

  // Weekly usage chart
  const usageWeek = Array(7).fill(0);
  usage?.forEach((u) => {
    const dow = dayjs(u.used_at).day();
    usageWeek[dow]++;
  });

  return NextResponse.json({
    ok: true,
    stats: {
      total_stock: stock?.reduce((a, b) => a + b.qty, 0) || 0,
      used_week: usage?.length || 0,
      top_size: topSizes[0]?.size || "—",
      vendor_count: Object.keys(vendors).length,

      usage_week: usageWeek,
      top_sizes: topSizes,
      market_stock: marketStock || [],
      vendor_breakdown: Object.entries(vendors).map(([vendor, count]) => ({
        vendor,
        count,
      })),
    },
  });
}
