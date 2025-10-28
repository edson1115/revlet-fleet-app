// app/api/requests/batch/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
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

/**
 * POST /api/requests/batch
 * Body:
 * {
 *   op: "assign" | "unassign" | "reschedule" | "status",
 *   ids: string[],
 *   technician_id?: string,           // assign
 *   scheduled_at?: string,            // ISO, reschedule
 *   status?: "NEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" // reschedule/status
 * }
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id)
    return NextResponse.json({ success: false, error: "No company." }, { status: 400 });

  const body = await req.json().catch(() => ({} as any));
  const { op, ids } = body as {
    op?: "assign" | "unassign" | "reschedule" | "status";
    ids?: string[];
    technician_id?: string;
    scheduled_at?: string;
    status?: "NEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  };

  if (!op || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing op or ids." },
      { status: 400 }
    );
  }

  if (op === "assign") {
    const technician_id = (body.technician_id || "").trim();
    if (!technician_id) {
      return NextResponse.json(
        { success: false, error: "technician_id is required for assign." },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("service_requests")
      .update({ technician_id })
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  if (op === "unassign") {
    const { error } = await supabase
      .from("service_requests")
      .update({ technician_id: null })
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  if (op === "reschedule") {
    const scheduled_at = body.scheduled_at ? String(body.scheduled_at) : null;
    if (!scheduled_at) {
      return NextResponse.json(
        { success: false, error: "scheduled_at is required for reschedule." },
        { status: 400 }
      );
    }
    const patch: Record<string, any> = { scheduled_at };
    if (body.status) patch.status = body.status;

    const { error } = await supabase
      .from("service_requests")
      .update(patch)
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  if (op === "status") {
    const status = body.status;
    if (!status) {
      return NextResponse.json(
        { success: false, error: "status is required for status op." },
        { status: 400 }
      );
    }
    const patch: Record<string, any> = { status };
    // Auto-set timestamps if you want: (kept conservative)
    if (status === "SCHEDULED") patch.scheduled_at = new Date().toISOString();
    if (status === "IN_PROGRESS") patch.started_at = new Date().toISOString();
    if (status === "COMPLETED") patch.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("service_requests")
      .update(patch)
      .in("id", ids)
      .eq("company_id", company_id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, op, updated: ids.length });
  }

  return NextResponse.json({ success: false, error: "Unsupported op." }, { status: 400 });
}
