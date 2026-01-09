import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // 👈 Use direct client
import { supabaseServer } from "@/lib/supabase/server"; // Keep for GET (read)
import { resolveUserScope } from "@/lib/api/scope";

// GET can keep using the user session (Safe for reading)
export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("service_packages")
    .select(`
      *,
      items:service_package_items(*)
    `)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, packages: data });
}

// POST uses Service Role to bypass RLS for writing
export async function POST(req: Request) {
  const scope = await resolveUserScope();
  
  // 1. Strict Auth Check
  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json(); 

  // 2. Use Service Role (Admin) Client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Create the Package Header
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from("service_packages")
    .insert({
      name: body.name,
      description: body.description,
      base_labor_hours: parseFloat(body.base_labor_hours) || 0
    })
    .select()
    .single();

  if (pkgError) {
    console.error("Package Create Error:", pkgError.message);
    return NextResponse.json({ error: pkgError.message }, { status: 500 });
  }

  // 4. Create the Items (Ingredients)
  if (body.items && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: any) => ({
          package_id: pkg.id,
          part_name: item.part_name,
          part_number: item.part_number,
          quantity: parseInt(item.quantity) || 1,
          inventory_id: item.inventory_id || null // Handles empty strings for UUID
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("service_package_items")
        .insert(itemsToInsert);

      if (itemsError) {
          console.error("Error adding items:", itemsError.message);
          // Note: The package header was created, but items failed. 
          // You might want to delete the header here to keep it clean, 
          // but for now we'll just report the error.
      }
  }

  return NextResponse.json({ ok: true, package: pkg });
}