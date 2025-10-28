// app/api/requests/[id]/status/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Allowed transitions per role.
 * Roles on profiles.role can be: CUSTOMER | OFFICE | DISPATCHER | TECH | ADMIN
 * ADMIN is treated as superuser (can set any status).
 */
const FLOW: Record<string, string[]> = {
  CUSTOMER: [],
  OFFICE: [
    "NEW",
    "WAITING_APPROVAL",
    "WAITING_PARTS",
    "WAITING_TO_SCHEDULE",
    "SCHEDULED",
    "COMPLETED",
    "CANCELED",
  ],
  DISPATCHER: ["WAITING_TO_SCHEDULE", "SCHEDULED", "IN_PROGRESS", "CANCELED"],
  TECH: ["IN_PROGRESS", "COMPLETED"],
  // ADMIN: handled specially in canSet() to allow all transitions
};

function canSet(role: string, target: string) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN") return true; // superuser
  return (FLOW[r] || []).includes(target);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const supabase = await supabaseServer();

  // Who is calling?
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const id = ctx.params.id;
  const body = await req.json().catch(() => ({} as any));
  const targetStatus: string = (body?.status || "").toUpperCase().trim();
  if (!targetStatus) return NextResponse.json({ error: "Missing status." }, { status: 400 });

  // Load role + company for caller
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", uid)
    .maybeSingle();
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  const role = String(prof?.role || "CUSTOMER").toUpperCase();
  const company_id = prof?.company_id || null;

  if (!canSet(role, targetStatus)) {
    return NextResponse.json(
      { error: `Role ${role} cannot set status to ${targetStatus}.` },
      { status: 403 }
    );
  }

  // Load request; verify same company; guard reschedule rules
  const { data: row, error: rowErr } = await supabase
    .from("service_requests")
    .select("id, company_id, status")
    .eq("id", id)
    .maybeSingle();
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (company_id && row.company_id && row.company_id !== company_id && role !== "ADMIN") {
    return NextResponse.json({ error: "Cross-company forbidden." }, { status: 403 });
  }

  // Only DISPATCHER can change away from SCHEDULED (reschedule) — ADMIN may override
  if (
    row.status === "SCHEDULED" &&
    targetStatus !== "COMPLETED" &&
    targetStatus !== "CANCELED" &&
    role !== "DISPATCHER" &&
    role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Only DISPATCHER can reschedule or change a SCHEDULED job." },
      { status: 403 }
    );
  }

  // Build patch + timestamps
  const patch: Record<string, any> = { status: targetStatus };
  const now = new Date().toISOString();
  if (targetStatus === "SCHEDULED") patch.scheduled_at = now;
  if (targetStatus === "IN_PROGRESS") patch.started_at = now;
  if (targetStatus === "COMPLETED") patch.completed_at = now;

  const { data: updated, error: upErr } = await supabase
    .from("service_requests")
    .update(patch)
    .eq("id", id)
    .select("id,status,scheduled_at,started_at,completed_at,updated_at")
    .maybeSingle();

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    status: updated?.status,
    scheduled_at: updated?.scheduled_at ?? null,
    started_at: updated?.started_at ?? null,
    completed_at: updated?.completed_at ?? null,
  });
}
