// lib/db/requests.ts
import { supabaseServer } from "./client";

export async function getRequestsByMarket() {
  const supabase = await supabaseServer();

  return supabase
    .from("view_requests")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function getActiveRequests() {
  const supabase = await supabaseServer();

  return supabase
    .from("active_requests_view")
    .select("*")
    .order("scheduled_at", { ascending: true });
}

export async function getRequest(id: string) {
  const supabase = await supabaseServer();

  return supabase
    .from("view_requests")
    .select("*")
    .eq("id", id)
    .single();
}

export async function updateRequestStatus(id: string, status: string) {
  const supabase = await supabaseServer();

  return supabase
    .from("requests")
    .update({ status })
    .eq("id", id);
}



