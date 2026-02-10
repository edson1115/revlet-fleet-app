import { supabaseServer } from "@/lib/supabase/server";

export type LogInput = {
  request_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  details?: Record<string, any>;
};

export async function createServiceLog(input: LogInput) {
  try {
    const supabase = await supabaseServer();
    
    const { error } = await supabase.from("service_logs").insert({
      request_id: input.request_id,
      actor_id: input.actor_id,
      actor_role: input.actor_role,
      action: input.action,
      details: input.details || {},
    });

    if (error) {
      console.error("Failed to write service log:", error.message);
    }
  } catch (err) {
    console.error("Error in createServiceLog:", err);
  }
}