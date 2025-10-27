// app/api/reports/requests/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dayStartISO(d: string) { return new Date(`${d}T00:00:00.000Z`).toISOString(); }
function dayEndISO(d: string) { return new Date(`${d}T23:59:59.999Z`).toISOString(); }

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof } = await supabase.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      if (prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (v?.company_id) return v.company_id as string;
  } catch {}
  return null;
}

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();
    const company_id = await resolveCompanyId();
    if (!company_id) return NextResponse.json({ rows: [], error: "no_company" }, { status: 400 });

    const url = new URL(req.url);
    const start = url.searchParams.get("start"); // YYYY-MM-DD
    const end = url.searchParams.get("end");     // YYYY-MM-DD
    const statuses = url.searchParams.getAll("status"); // multi OK
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    let q = supabase
      .from("service_requests")
      .select(`
        id, company_id, status, created_at, scheduled_at, started_at, completed_at,
        service, fmc, mileage, po, notes,
        vehicle:vehicle_id ( id, unit_number, year, make, model, plate, vin ),
        customer:customer_id ( id, name ),
        location:location_id ( id, name )
      `)
      .eq("company_id", company_id)
      .order("created_at", { ascending: false });

    if (start) q = q.gte("created_at", dayStartISO(start));
    if (end) q = q.lte("created_at", dayEndISO(end));
    if (statuses.length === 1) q = q.eq("status", statuses[0]);
    if (statuses.length > 1) q = q.in("status", statuses);

    const { data, error } = await q;
    if (error) return NextResponse.json({ rows: [], error: error.message }, { status: 500 });

    const rows = data ?? [];
    if (format !== "csv") return NextResponse.json({ rows });

    // CSV export
    const headers = [
      "id","status","created_at","scheduled_at","started_at","completed_at",
      "service","fmc","mileage","po","notes",
      "vehicle_unit","vehicle_year","vehicle_make","vehicle_model","vehicle_plate","vehicle_vin",
      "customer","location"
    ];
    const esc = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of rows as any[]) {
      lines.push([
        r.id, r.status, r.created_at, r.scheduled_at, r.started_at, r.completed_at,
        r.service, r.fmc, r.mileage, r.po, r.notes,
        r.vehicle?.unit_number ?? "", r.vehicle?.year ?? "", r.vehicle?.make ?? "", r.vehicle?.model ?? "", r.vehicle?.plate ?? "", r.vehicle?.vin ?? "",
        r.customer?.name ?? "", r.location?.name ?? ""
      ].map(esc).join(","));
    }
    const csv = lines.join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="service_requests.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
