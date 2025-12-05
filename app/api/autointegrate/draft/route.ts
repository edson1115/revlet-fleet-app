// app/api/autointegrate/draft/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildAutoIntegrateDraft } from "@/lib/autointegrate/buildDraft";

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json(
        { error: "Missing requestId" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    // 1. Build the draft payload
    const payload = await buildAutoIntegrateDraft(requestId);

    // 2. Check if we already have a job
    const { data: existing } = await supabase
      .from("autointegrate_jobs")
      .select("id")
      .eq("request_id", requestId)
      .maybeSingle();

    let jobId = existing?.id;

    if (!jobId) {
      // 3. Insert new job
      const { data: insert, error: insertErr } = await supabase
        .from("autointegrate_jobs")
        .insert({
          request_id: requestId,
          status: "draft",
          payload,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      jobId = insert.id;
    } else {
      // 4. Update existing job with new draft payload
      const { error: updateErr } = await supabase
        .from("autointegrate_jobs")
        .update({
          status: "draft",
          payload,
        })
        .eq("id", jobId);

      if (updateErr) throw updateErr;
    }

    // 5. Log the event
    await supabase.from("autointegrate_logs").insert({
      job_id: jobId,
      request_id: requestId,
      action: "draft",
      message: "Generated AutoIntegrate draft",
      payload,
    });

    // 6. Save easy-access fields to service_requests
    await supabase
      .from("service_requests")
      .update({
        ai_status: "draft",
        ai_job_id: jobId,
        ai_last_synced_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // 7. Return the payload to the client
    return NextResponse.json(
      { jobId, payload, status: "draft" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("AI DRAFT ERR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate draft" },
      { status: 500 }
    );
  }
}



