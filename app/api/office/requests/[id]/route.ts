import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/audit/logActivity";

export const dynamic = "force-dynamic";

// --- HELPER: GET SUPABASE CLIENT ---
async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch { }
            },
          },
        }
      );
}

export async function GET(req: Request, context: any) {
  const { id: requestId } = await context.params;
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers ( id, name ),
      vehicle:vehicles ( year, make, model, plate, unit_number, vin ),
      tech:profiles!service_requests_technician_id_fkey ( id, full_name ),
      request_images ( id, url_full )
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!request) return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });

  return NextResponse.json({ ok: true, request });
}

/* =========================================================
   PATCH — Update Request (UNRESTRICTED ADMIN MODE)
========================================================= */
export async function PATCH(req: Request, context: any) {
  const { id: requestId } = await context.params;
  const supabase = await getSupabase();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // 2. Parse Body
  const body = await req.json();
  console.log("📝 PATCH FORCE UPDATE:", body); // 👈 Logs what is happening

  // 3. Get Current Status (For Logging Only)
  const { data: currentRequest } = await supabase
    .from("service_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  const currentStatus = currentRequest?.status || "UNKNOWN";
  const nextStatus = body.status;

  // 4. Build Update Object (Accept EVERYTHING)
  const updates: any = {};

  if (body.technician_id !== undefined) updates.technician_id = body.technician_id;
  if (body.scheduled_date !== undefined) updates.scheduled_date = body.scheduled_date;
  if (body.status !== undefined) updates.status = body.status;
  if (body.service_title !== undefined) updates.service_title = body.service_title;
  if (body.service_description !== undefined) updates.service_description = body.service_description;
  if (body.po !== undefined) updates.po = body.po;
  if (body.invoice_number !== undefined) updates.invoice_number = body.invoice_number;
  if (body.office_notes !== undefined) updates.office_notes = body.office_notes;

  // 5. Perform Update (NO VALIDATION CHECKS)
  const { data, error } = await supabase
    .from("service_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("❌ Database Error:", error);
    // If enum error, it means 'APPROVED' isn't in your DB options
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 6. Log Activity
  if (nextStatus && nextStatus !== currentStatus) {
    await logActivity({
      request_id: requestId,
      actor_id: user.id,
      actor_role: "OFFICE",
      action: "STATUS_CHANGE",
      from_value: currentStatus,
      to_value: nextStatus,
    });
  }

  return NextResponse.json({ ok: true, request: data });
}