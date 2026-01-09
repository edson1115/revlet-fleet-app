import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole, INTERNAL } from "@/lib/supabase/server-helpers";
import { logActivity } from "@/lib/audit/logActivity";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, role } = await getUserAndRole();
    
    // 1. Auth Check
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    // 2. Perform Update
    // Dispatch primarily updates scheduling info (tech, eta, status)
    const { error } = await supabase
      .from("service_requests")
      .update({
        technician_id: body.tech_id ?? null,
        eta_start: body.eta_start ?? null,
        eta_end: body.eta_end ?? null,
        status: "SCHEDULED",
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    // 3. ✅ LOG ACTIVITY: Tech Assignment
    if (body.tech_id) {
      await logActivity({
        request_id: id,
        actor_id: user.id,
        actor_role: "DISPATCH",
        action: "ASSIGNED_TECH",
        message: `Assigned technician ${body.tech_id}`,
        meta: {
          technician_id: body.tech_id,
          eta_start: body.eta_start,
          eta_end: body.eta_end
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Dispatch Update Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}