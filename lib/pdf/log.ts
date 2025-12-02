import { supabaseServer } from "@/lib/supabase/server";

export async function logPDF({
  requestId,
  action,
  actor,
  actorEmail,
  meta = {},
}: {
  requestId: string;
  action: string;
  actor?: string | null;
  actorEmail?: string | null;
  meta?: any;
}) {
  try {
    const supabase = await supabaseServer();
    await supabase.from("pdf_logs").insert({
      request_id: requestId,
      action,
      actor: actor || null,
      actor_email: actorEmail || null,
      meta,
    });
  } catch (err) {
    console.error("Failed to log PDF action:", err);
  }
}
