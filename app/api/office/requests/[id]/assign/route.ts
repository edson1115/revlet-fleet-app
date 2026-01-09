import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { logActivity } from "@/lib/audit/logActivity";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id } = await params;
  const { technician_id } = await req.json();

  // 🛑 SECURITY CHECK
  // Only Dispatchers, Admins, or SuperAdmins can assign techs.
  // Office users are blocked.
  const ALLOWED_ROLES = ["DISPATCHER", "ADMIN", "SUPERADMIN"];
  
  // If user is not logged in OR their role is not in the allowed list
  if (!scope.uid || !ALLOWED_ROLES.includes(scope.role)) {
    return NextResponse.json({ 
        error: "Unauthorized: Only Dispatchers can schedule technicians." 
    }, { status: 403 });
  }

  const supabase = await supabaseServer();

  // Update the job
  const { error } = await supabase
    .from("service_requests")
    .update({ 
        technician_id: technician_id,
        status: technician_id ? 'SCHEDULED' : 'NEW'
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit Log
  await logActivity({
    request_id: id,
    actor_id: scope.uid,
    actor_role: scope.role,
    action: "DISPATCH_ASSIGN",
    message: technician_id ? `Assigned to Tech ID: ${technician_id}` : "Unassigned from Tech"
  });

  return NextResponse.json({ ok: true });
}