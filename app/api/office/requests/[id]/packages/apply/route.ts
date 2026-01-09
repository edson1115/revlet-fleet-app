import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // 👈 Direct Client
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveUserScope();
  const { id: requestId } = await params;

  // 1. Auth Check (Keep this strict)
  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { package_id } = await req.json();

  // 2. Use Admin Client to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Fetch the Package Items
  const { data: pkgItems, error: pkgError } = await supabaseAdmin
    .from("service_package_items")
    .select("*")
    .eq("package_id", package_id);

  if (pkgError || !pkgItems || pkgItems.length === 0) {
    console.error("Package Fetch Error:", pkgError?.message);
    return NextResponse.json({ error: "Package not found or empty" }, { status: 404 });
  }

  // 4. Prepare Items for Insertion
  const itemsToInsert = [];

  for (const item of pkgItems) {
      let cost = 0;
      let price = 0;

      // If linked to inventory, fetch live pricing (Admin read)
      if (item.inventory_id) {
          const { data: invItem } = await supabaseAdmin
              .from("inventory")
              .select("cost, sell_price")
              .eq("id", item.inventory_id)
              .single();
          
          if (invItem) {
              cost = invItem.cost;
              price = invItem.sell_price;
          }
      }

      itemsToInsert.push({
          request_id: requestId,
          inventory_id: item.inventory_id || null, // Handle empty strings safely
          part_name: item.part_name,
          part_number: item.part_number,
          quantity: item.quantity,
          cost: cost,
          price: price
      });
  }

  // 5. Insert All Parts (Admin write)
  const { error: insertError } = await supabaseAdmin
    .from("request_parts")
    .insert(itemsToInsert);

  if (insertError) {
      console.error("Insert Parts Error:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: itemsToInsert.length });
}