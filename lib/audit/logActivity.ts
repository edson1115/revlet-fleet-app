import { supabaseService } from "@/lib/supabase/server";

type LogInput = {
  request_id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  from_value?: string | null;
  to_value?: string | null;
  meta?: any;
};

export async function logActivity(input: LogInput) {
  const supabase = supabaseService();

  await supabase.from("activity_log").insert({
    request_id: input.request_id,
    actor_id: input.actor_id,
    actor_role: input.actor_role,
    action: input.action,
    from_value: input.from_value ?? null,
    to_value: input.to_value ?? null,
    meta: input.meta ?? null,
  });
}
