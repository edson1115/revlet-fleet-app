// app/api/autointegrate/submit/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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

    // 1. Load the existing draft job
    const { data: job, error: jobErr } = await supabase
      .from("autointegrate_jobs")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (jobErr || !job)
      throw new Error("Draft not found. Generate a draft first.");

    if (!job.payload)
      throw new Error("Draft payload is empty.");

    // 2. Prepare payload for AutoIntegrate
    const aiPayload = job.payload;

    // 3. Call AutoIntegrate API
    const resp = await fetch("https://api.autointegrate.com/v1/createJob", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Key": process.env.AUTOINTEGRATE_API_KEY!,
      },
      body: JSON.stringify(aiPayload),
    });

    const aiRes = await resp.json();

    if (!resp.ok) {
      // log error
      await supabase.from("autointegrate_logs").insert({
        job_id: job.id,
        request_id: requestId,
        action: "error",
        message: "AutoIntegrate submission failed",
        payload: aiRes,
      });

      throw new Error(aiRes?.error || "AutoIntegrate API error");
    }

    // Extract returned identifiers
    const aiJobNumber = aiRes?.jobNumber || null;
    const aiQuoteId = aiRes?.quoteId || null;

    // 4. Update job table
    await supabase
      .from("autointegrate_jobs")
      .update({
        status: "submitted",
        ai_job_number: aiJobNumber,
        ai_quote_id: aiQuoteId,
        response: aiRes,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // 5. Update service_requests shortcuts
    await supabase
      .from("service_requests")
      .update({
        ai_status: "submitted",
        ai_job_id: job.id,
        ai_quote_id: aiQuoteId,
        ai_last_synced_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // 6. Log event
    await supabase.from("autointegrate_logs").insert({
      job_id: job.id,
      request_id: requestId,
      action: "submitted",
      message: "Submitted to AutoIntegrate",
      payload: aiRes,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      aiJobNumber,
      aiQuoteId,
      status: "submitted",
    });
  } catch (err: any) {
    console.error("AI SUBMIT ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Failed to submit draft" },
      { status: 500 }
    );
  }
}
