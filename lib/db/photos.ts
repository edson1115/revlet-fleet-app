// lib/db/photos.ts
import { supabaseServer } from "./client";

export async function getPhotos(requestId: string) {
  const supabase = supabaseServer();

  return supabase
    .from("request_photos")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
}

export async function insertPhoto(payload: {
  request_id: string;
  url: string;
  kind: string; // before | after | damage
}) {
  const supabase = supabaseServer();

  return supabase.from("request_photos").insert(payload).select().single();
}
