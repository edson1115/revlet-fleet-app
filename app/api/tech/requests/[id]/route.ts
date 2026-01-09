import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { logActivity } from "@/lib/audit/logActivity";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await resolveUserScope();
  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();
  
  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(name, address, phone),
      vehicle:vehicles(year, make, model, plate, unit_number, vin),
      request_parts(*),
      request_images(*)
    `)
    .eq("id", id)
    .order("created_at", { referencedTable: "request_images", ascending: false })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, request: data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await resolveUserScope();
  
  if (!scope.uid || !["TECH", "OFFICE", "ADMIN", "SUPERADMIN"].includes(scope.role)) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = await supabaseServer(); 
  const adminDb = supabaseService();       

  const { data: current, error: loadError } = await supabase
    .from("service_requests")
    .select("status, technician_id, vehicle_id, office_notes")
    .eq("id", id)
    .single();

  if (loadError || !current) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  let updates: any = {};
  let logAction = "UPDATE"; 
  let metaData: any = {};

  if (scope.role === "TECH") {
    
    if (body.action === "START") {
      if (current.status !== "SCHEDULED" && current.status !== "NEW" && current.status !== "ATTENTION_REQUIRED") {
        return NextResponse.json({ error: "Job must be SCHEDULED before starting" }, { status: 400 });
      }
      updates.status = "IN_PROGRESS";
      updates.started_at = new Date().toISOString();
      updates.technician_id = scope.uid; 
      logAction = "START_JOB";
    }

    else if (body.action === "COMPLETE") {
      if (current.status !== "IN_PROGRESS") {
        return NextResponse.json({ error: "Job must be IN_PROGRESS before completing" }, { status: 400 });
      }
      updates.status = "COMPLETED";
      updates.completed_at = new Date().toISOString();
      updates.completed_by_role = "TECH";
      logAction = "COMPLETE_JOB";
    }

    else if (body.action === "REPORT_ISSUE") {
       updates.status = "ATTENTION_REQUIRED"; 
       updates.technician_id = null; 
       
       const reason = body.reason || "Unable to service";
       const prevNotes = current.office_notes ? current.office_notes + "\n" : "";
       updates.office_notes = `${prevNotes}[🚨 MISSED - ${new Date().toLocaleDateString()}]: ${reason}`; 
       
       logAction = "JOB_MISSED";
       metaData.reason = reason;
    }
    
    // Logic for technician notes update
    else if (body.action === "UPDATE_NOTES") {
      updates.technician_notes = body.notes;
      logAction = "UPDATE_NOTES";
    }
  
  } else {
    const allowed = ["status", "technician_id", "service_scope", "description", "admin_notes", "price"];
    allowed.forEach((field) => {
      if (body[field] !== undefined) updates[field] = body[field];
    });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided." }, { status: 400 });
  }

  const { data, error } = await adminDb
    .from("service_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single(); 

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logActivity({
    request_id: id,
    actor_id: scope.uid,
    actor_role: scope.role,
    action: logAction,
    from_status: current.status,
    to_status: updates.status || current.status,
    meta: { vehicle_id: current.vehicle_id, ...metaData }
  });
  
  return NextResponse.json({ ok: true, request: data });
}