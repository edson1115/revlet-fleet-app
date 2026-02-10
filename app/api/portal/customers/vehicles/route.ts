import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server"; // FIX: Correct import

export async function GET() {
  const supabase = await supabaseServer();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch customer record for this authenticated user
  // Adjust .eq("profile_id", user.id) to .eq("email", user.email) if that is your schema
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", user.email) 
    .maybeSingle();

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select(`
      id, unit_number, plate, year, make, model, vin,
      location:location_id ( id, name )
    `)
    .eq("customer_id", customer.id)
    .order("unit_number", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}