// lib/db/parts.ts
import { supabaseServer } from "./client";

export async function getRequestParts(requestId: string) {
  const supabase = await supabaseServer();

  return supabase
    .from("service_parts_view")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at");
}

export async function insertRequestPart(payload: {
  request_id: string;
  part_name: string;
  part_number: string;
  quantity: number;
}) {
  const supabase = await supabaseServer();

  return supabase.from("service_request_parts").insert(payload).select();
}

export async function updateRequestPart(id: string, quantity: number) {
  const supabase = await supabaseServer();

  return supabase
    .from("service_request_parts")
    .update({ quantity })
    .eq("id", id);
}



