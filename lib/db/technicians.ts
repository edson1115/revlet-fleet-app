// lib/db/technicians.ts
import { supabaseServer } from "./client";

export async function getTechniciansByMarket() {
  const supabase = supabaseServer();

  return supabase.from("technicians").select("*").eq("active", true);
}

export async function getTechnician(id: string) {
  const supabase = supabaseServer();

  return supabase.from("technicians").select("*").eq("id", id).single();
}
