import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await resolveUserScope();
  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  // 1. Fetch Closed/Billed Jobs (Revenue Data)
  const { data: billed, error } = await supabase
    .from("service_requests")
    .select("id, invoice_grand_total, service_title, created_at, status")
    .eq("status", "BILLED")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Fetch Active Pipeline (Work in progress = Future Money)
  const { count: pendingCount } = await supabase
    .from("service_requests")
    .select("*", { count: 'exact', head: true })
    .not("status", "in", "('BILLED', 'CANCELLED', 'COMPLETED')"); 

  // 3. Crunch the Financials
  // Handle empty data safely with || 0
  const totalRevenue = billed?.reduce((acc, curr) => acc + (curr.invoice_grand_total || 0), 0) || 0;
  const totalTickets = billed?.length || 0;
  const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  // 4. Calculate Top Services
  const serviceStats: Record<string, number> = {};
  billed?.forEach(r => {
      const title = r.service_title || "Other Service";
      serviceStats[title] = (serviceStats[title] || 0) + (r.invoice_grand_total || 0);
  });

  // Sort by highest revenue and take top 5
  const topServices = Object.entries(serviceStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // 5. Recent Sales (Take the first 5 from the sorted query)
  const recentSales = billed?.slice(0, 5) || [];

  return NextResponse.json({
    ok: true,
    // Match the exact structure your Client component expects:
    stats: {
      totalRevenue,
      totalTickets,
      avgTicket,
      pendingCount
    },
    topServices,
    recentSales
  });
}