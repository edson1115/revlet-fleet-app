// lib/db/vehicles.ts
import { supabaseServer } from "./client";

export async function getVehiclesByMarket() {
  const supabase = await supabaseServer();
  return supabase.from("vehicle_market_view").select("*");
}

export async function getVehicle(id: string) {
  const supabase = await supabaseServer();
  return supabase.from("vehicles").select("*").eq("id", id).single();
}

export async function insertVehicle(payload: any) {
  const supabase = await supabaseServer();
  return supabase.from("vehicles").insert(payload).select().single();
}

export async function updateVehicle(id: string, payload: any) {
  const supabase = await supabaseServer();
  return supabase.from("vehicles").update(payload).eq("id", id);
}



