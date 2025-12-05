// app/api/autointegrate/poll-all/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // 1. Find all active submitted jobs
  const { data: jobs } = await supabase
    .from("autointegrate_jobs")
    .select("*")
    .in("status", ["submitted", "in_progress", "pending", "waiting"])
    .order("created_at", { ascending: false });

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ message: "No active jobs to poll" });
  }

  let count = 0;

  for (const job of jobs) {
    try {
      const payload = {
        jobNumber: job.ai_job_number,
      };

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
      if (!resp.ok) continue;

      count++;

      const aiStatus = aiRes.status || null;

      await supabase
        .from("autointegrate_jobs")
        .update({
          status: aiStatus?.toLowerCase() || job.status,
          ai_po_number: aiRes.poNumber ?? job.ai_po_number,
          ai_quote_id: aiRes.quoteId ?? job.ai_quote_id,
          last_status: aiStatus,
          last_poll_response: aiRes,
          last_polled_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      await supabase.from("autointegrate_logs").insert({
        job_id: job.id,
        request_id: job.request_id,
        action: "poll",
        message: `Cron poll — status: ${aiStatus}`,
        payload: aiRes,
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    polled: count,
    total: jobs.length,
    message: `Polled ${count} jobs`,
  });
}



