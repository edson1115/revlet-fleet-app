// app/api/requests/batch/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { UI_TO_DB_STATUS } from "@/lib/status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function httpErr(msg: string, code = 400) {
  return NextResponse.json({ success: false, error: msg }, { status: code });
}

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      if (!error && prof?.company_id) return prof.company_id as string;
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

function toDbStatus(input?: string | null): string | null {
  if (!input) return null;
  const u = String(input).trim().toUpperCase();
  return (UI_TO_DB_STATUS as any)[u] ?? u;
}

function nextBusinessDay4amISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const day = d.getDay(); // 0 Sun, 6 Sat
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  d.setHours(4, 0, 0, 0);
  return d.toISOString();
}

/**
 * POST /api/requests/batch
 * Body: { op: "assign" | "unassign" | "reschedule" | "status",
 *         ids: string[], technician_id?, scheduled_at?, status? }
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return httpErr("No company.", 400);

  const body = await req.json().catch(() => ({} as any));
  const { op, ids } = body as {
    op?: "assign" | "unassign" | "reschedule" | "status";
    ids?: string[];
    technician_id?: string;
    scheduled_at?: string;
    status?: string;
    require_assigned?: boolean;
  };

  if (!op || !Array.isArray(ids) || ids.length === 0) {
    return httpErr("Missing op or ids.", 400);
  }

  // assign technician
  if (op === "assign") {
    const technician_id = (body.technician_id || "").trim();
    if (!technician_id) return httpErr("technician_id is required for assign.", 400);

    // (optional) verify tech belongs to same company & is active
    const { data: tech } = await supabase
      .from("technicians")
      .select("id, company_id, active")
      .eq("id", technician_id)
      .maybeSingle();
    if (!tech || tech.company_id !== company_id) return httpErr("invalid_technician", 400);

    const { error } = await supabase
      .from("service_requests")
      .update({ technician_id })
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return httpErr(error.message, 500);
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  // unassign technician
  if (op === "unassign") {
    const { error } = await supabase
      .from("service_requests")
      .update({ technician_id: null })
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return httpErr(error.message, 500);
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  // reschedule (optionally flip status)
  if (op === "reschedule") {
    let iso = body.scheduled_at ? new Date(String(body.scheduled_at)).toISOString() : "";
    if (!iso) iso = nextBusinessDay4amISO();

    const dbStatus = toDbStatus(body.status);
    const requireAssigned = !!body.require_assigned || dbStatus === "SCHEDULED";

    if (requireAssigned) {
      // ensure each request already has a technician assigned
      const { data: rs } = await supabase
        .from("service_requests")
        .select("id, technician_id")
        .in("id", ids)
        .eq("company_id", company_id);
      const missing = (rs ?? []).filter(r => !r.technician_id).map(r => r.id);
      if (missing.length) {
        return httpErr(`Technician required before scheduling. Missing for: ${missing.join(", ")}`, 400);
      }
    }

    const patch: Record<string, any> = { scheduled_at: iso };
    if (dbStatus) patch.status = dbStatus;

    const { error } = await supabase
      .from("service_requests")
      .update(patch)
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return httpErr(error.message, 500);
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  // direct status set
  if (op === "status") {
    const dbStatus = toDbStatus(body.status);
    if (!dbStatus) return httpErr("status is required for status op.", 400);

    const patch: Record<string, any> = { status: dbStatus };
    if (dbStatus === "SCHEDULED" && !body.scheduled_at) {
      patch.scheduled_at = nextBusinessDay4amISO();
    }

    const { error } = await supabase
      .from("service_requests")
      .update(patch)
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return httpErr(error.message, 500);
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  return httpErr("Unsupported op.", 400);
}
