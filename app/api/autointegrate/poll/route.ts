// app/api/autointegrate/poll/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { requestId } = await req.json();
    if (!requestId)
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });

    const supabase = await supabaseServer();

    // 1. Load AI job
    const { data: job, error: jobErr } = await supabase
      .from("autointegrate_jobs")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (jobErr || !job)
      throw new Error("AutoIntegrate job not found for this request");

    if (!job.ai_job_number)
      throw new Error("This request has not been submitted to AutoIntegrate");

    const payload = {
      jobNumber: job.ai_job_number,
    };

    // 2. Call AI Job Status API
    const resp = await fetch(
      "https://api.autointegrate.com/v1/getJobStatus",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-Key": process.env.AUTOINTEGRATE_API_KEY!,
        },
        body: JSON.stringify(payload),
      }
    );

    const aiRes = await resp.json();

    if (!resp.ok) {
      await supabase.from("autointegrate_logs").insert({
        job_id: job.id,
        request_id: requestId,
        action: "error",
        message: "Polling failed",
        payload: aiRes,
      });
      throw new Error(aiRes?.error || "AutoIntegrate polling error");
    }

    // Extract useful info
    const aiStatus = aiRes.status || null;
    const aiPO = aiRes.poNumber || null;
    const aiQuote = aiRes.quoteId || null;

    // 3. Update job
    await supabase
      .from("autointegrate_jobs")
      .update({
        status: aiStatus?.toLowerCase() || job.status,
        ai_po_number: aiPO,
        ai_quote_id: aiQuote,
        last_status: aiStatus,
        last_poll_response: aiRes,
        last_polled_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // 4. Update service request
    await supabase
      .from("service_requests")
      .update({
        ai_status: aiStatus,
        ai_po_number: aiPO,
        ai_quote_id: aiQuote,
        ai_last_synced_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // 5. Log event
    await supabase.from("autointegrate_logs").insert({
      job_id: job.id,
      request_id: requestId,
      action: "poll",
      message: `Polled AI — status: ${aiStatus}`,
      payload: aiRes,
    });

    return NextResponse.json({
      success: true,
      aiStatus,
      aiPO,
      aiQuote,
      raw: aiRes,
    });
  } catch (err: any) {
    console.error("AI POLL ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Polling failed" },
      { status: 500 }
    );
  }
}
