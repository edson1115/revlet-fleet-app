// lib/db/notes.ts
import { supabaseServer } from "./client";

export async function getNotes(requestId: string) {
  const supabase = supabaseServer();

  return supabase
    .from("service_notes_view")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
}

export async function insertNote(payload: {
  request_id: string;
  text: string;
}) {
  const supabase = supabaseServer();
  return supabase.from("request_notes").insert(payload).select().single();
}
