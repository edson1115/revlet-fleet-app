// lib/db/events.ts
import { supabaseServer } from "./client";

export async function getEvents(requestId: string) {
  const supabase = supabaseServer();

  return supabase
    .from("service_events_view")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
}

export async function insertEvent(payload: {
  request_id: string;
  event_type: string;
  message?: string | null;
  from_status?: string | null;
  to_status?: string | null;
}) {
  const supabase = supabaseServer();

  return supabase.from("service_events").insert(payload);
}
