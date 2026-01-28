import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  const scope = await resolveUserScope();
  // Only Admins or Office managers can receive stock
  if (!scope.isAdmin && !scope.isOffice) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { part_id, quantity, vendor, cost_per_unit } = await req.json();

  if (!part_id || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // 1. UPDATE STOCK (Increment)
  // We use a safe RPC call or direct update
  const { error: stockError } = await supabase.rpc('increment_stock', { 
      item_id: part_id, 
      qty: Number(quantity) 
  });

  // Fallback if RPC doesn't exist (Direct Update)
  if (stockError) {
      // Fetch current
      const { data: current } = await supabase.from('inventory').select('stock').eq('id', part_id).single();
      await supabase.from('inventory').update({ 
          stock: (current?.stock || 0) + Number(quantity),
          last_restock_date: new Date().toISOString(),
          cost: cost_per_unit // Update latest cost basis
      }).eq('id', part_id);
  }

  // 2. LOG THE TRANSACTION (Optional but recommended for auditing)
  /*
  await supabase.from('inventory_logs').insert({
      inventory_id: part_id,
      change: quantity,
      reason: 'RESTOCK',
      user_id: scope.uid,
      vendor: vendor
  });
  */

  return NextResponse.json({ success: true });
}