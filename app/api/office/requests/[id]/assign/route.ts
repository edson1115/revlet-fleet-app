import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { createServiceLog } from "@/lib/api/logs";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const requestId = params.id;
  
  const scope = await resolveUserScope();

  // Basic Auth Check
  if (!scope.uid || !["ADMIN", "OFFICE", "DISPATCH", "SUPERADMIN"].includes(scope.role || "")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { technician_id } = await req.json();
    const supabase = await supabaseServer();

    // Update the request
    const { error } = await supabase
      .from("service_requests")
      .update({ 
        technician_id: technician_id || null,
        // Optional: Update status if tech is assigned vs unassigned
        status: technician_id ? "ASSIGNED" : "WAITING" 
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // FIX: 'message' is not in LogInput type. Use 'details' instead.
    await createServiceLog({
      request_id: requestId,
      actor_id: scope.uid,
      actor_role: scope.role!,
      action: "DISPATCH_ASSIGN",
      details: {
        message: technician_id 
          ? `Assigned to Tech ID: ${technician_id}` 
          : "Unassigned from Tech",
        technician_id
      }
    });

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}