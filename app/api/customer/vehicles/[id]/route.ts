import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await supabaseServer();

    // 1. FOOLPROOF SAFETY CHECK
    // Fetch status of ALL requests for this vehicle
    const { data: requests, error: fetchError } = await supabase
      .from("service_requests")
      .select("status")
      .eq("vehicle_id", id);

    if (fetchError) {
      console.error("Fetch Error:", fetchError);
      return NextResponse.json({ ok: false, error: "Database error checking history." }, { status: 500 });
    }

    // Filter in JavaScript (100% reliable)
    // We look for any request that is NOT 'COMPLETED' and NOT 'CANCELLED'
    const activeRequests = requests?.filter(r => 
        r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
    ) || [];

    // Block if we found any active ones
    if (activeRequests.length > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: `Cannot archive: This vehicle has ${activeRequests.length} active service request(s). Please wait for them to finish.` 
      }, { status: 400 });
    }

    // 2. PROCEED: Soft Delete (Mark as ARCHIVED)
    const { error: updateError } = await supabase
      .from("vehicles")
      .update({ status: "ARCHIVED" })
      .eq("id", id);

    if (updateError) {
      console.error("Archive Error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}