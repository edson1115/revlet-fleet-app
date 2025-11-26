// lib/db/markets.ts
import { supabaseServer } from "./client";

export async function getUserMarkets() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_markets")
    .select("market")
    .eq("user_id", user.id);

  if (error) return [];

  return data.map((m) => m.market);
}

export async function getActiveMarket() {
  const markets = await getUserMarkets();
  return markets[0] ?? null; // first assigned market
}
