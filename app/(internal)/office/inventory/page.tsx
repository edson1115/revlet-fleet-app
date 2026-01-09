import { supabaseServer } from "@/lib/supabase/server";
import InventoryDashboardClient from "./InventoryDashboardClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = await supabaseServer();

  // Fetch all inventory items, sorted by newest
  const { data: inventory, error } = await supabase
    .from("inventory")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Inventory Load Error:", error);
  }

  return <InventoryDashboardClient initialInventory={inventory || []} />;
}