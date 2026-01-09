import { supabaseServer } from "@/lib/supabase/server";

type LogActivityArgs = {
  requestId: string;
  actorId?: string;
  actorRole: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  message?: string;
  metadata?: Record<string, any>;
};

export async function logActivity({
  requestId,
  actorId,
  actorRole,
  action,
  fromStatus,
  toStatus,
  message,
  metadata,
}: LogActivityArgs) {
  const supabase = await supabaseServer();

  await supabase.from("activity_log").insert({
    request_id: requestId,
    actor_id: actorId ?? null,
    actor_role: actorRole,
    action,
    from_status: fromStatus ?? null,
    to_status: toStatus ?? null,
    message: message ?? null,
    metadata: metadata ?? null,
  });
}
