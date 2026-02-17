import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";
import { createServiceLog } from "@/lib/api/logs"; 
import { sendServiceReportEmail } from "@/lib/email/service-report"; 
import { EmailTemplates } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const scope = await resolveUserScope();

  if (!scope.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status, notes } = body; 

  if (!id || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Next.js 15: supabaseServer is now async due to cookies()
  const supabase = await supabaseServer();

  // 1. Verify Ownership
  const { data: job, error: jobError } = await supabase
    .from("service_requests")
    .select("status, technician_id, second_technician_id")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const isAssigned = 
    job.technician_id === scope.uid || 
    job.second_technician_id === scope.uid || 
    ["ADMIN", "SUPERADMIN"].includes(scope.role || "");

  if (!isAssigned) {
    return NextResponse.json({ error: "Not assigned" }, { status: 403 });
  }

  // 2. Prepare Updates
  const now = new Date().toISOString();
  // Using Record to avoid 'any' where possible
  const updates: Record<string, any> = { status };

  if (notes !== undefined && notes !== null) {
      updates.technician_notes = notes;
  }

  if (status === "IN_PROGRESS") {
    updates.started_at = now;
  } else if (status === "COMPLETED") {
    updates.completed_at = now;
    updates.completed_by_role = scope.role;
  }

  // 3. Perform Status Update
  const { data: updatedJob, error: updateError } = await supabase
    .from("service_requests")
    .update(updates)
    .eq("id", id)
    .select(`
        *, 
        customer:customers(email, name), 
        vehicle:vehicles(year, model)
    `)
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // ✅ 4. EMAIL TRIGGER: JOB STARTED
  if (status === "IN_PROGRESS" && updatedJob?.customer?.email) {
      const vehicleName = `${updatedJob.vehicle?.year || ''} ${updatedJob.vehicle?.model || ''}`.trim();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Fire and forget email trigger
      fetch(`${baseUrl}/api/system/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              to: updatedJob.customer.email,
              subject: `Service Started: ${vehicleName}`,
              html: EmailTemplates.jobStarted(updatedJob.customer.name, vehicleName)
          })
      }).catch(err => console.error("Start Job Email Failed:", err));
  }

  // ✅ 5. INVENTORY SYNC & REPORT (Only on Completion)
  if (status === "COMPLETED") {
      // A. Inventory Sync Logic
      const { data: partsUsed } = await supabase
          .from("request_parts")
          .select("inventory_id, quantity")
          .eq("request_id", id)
          .not("inventory_id", "is", null); 

      if (partsUsed && partsUsed.length > 0) {
          for (const part of partsUsed) {
              const { data: currentStock } = await supabase
                  .from("inventory")
                  .select("quantity")
                  .eq("id", part.inventory_id)
                  .single();
              
              if (currentStock) {
                  const newQty = (currentStock.quantity || 0) - (part.quantity || 0);
                  await supabase
                      .from("inventory")
                      .update({ quantity: newQty })
                      .eq("id", part.inventory_id);
              }
          }
      }

      // C. Send Service Report Email
      sendServiceReportEmail(id).catch(err => console.error("Service Report trigger failed:", err));
  }

  // 6. Log Activity
  await createServiceLog({
    request_id: id,
    actor_id: scope.uid,
    actor_role: scope.role || "TECHNICIAN",
    action: "STATUS_CHANGE",
    details: {
      from_value: job.status,
      to_value: status,
      message: notes ? `Status: ${status} | Note: ${notes}` : `Status: ${status}`,
    }
  });

  return NextResponse.json({ ok: true });
}