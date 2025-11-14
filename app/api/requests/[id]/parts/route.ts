import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();

  const body = await req.json();
  const { name, part_number, quantity, price } = body;

  const { data: auth } = await supabase.auth.getUser();
  const techId = auth?.user?.id;

  const { error } = await supabase
    .from("service_request_parts")
    .insert({
      request_id: params.id,
      part_name: name,
      part_number: part_number || null,
      quantity: quantity || 1,
      price: price || null,
      technician_id: techId,
    });

    await supabase
  .from("office_inbox")
  .insert({
    request_id: params.id,
    message: `New part added by tech: ${name} (${part_number || "no #"}), qty ${quantity}`,
    type: "PART_ADDED",
  });


  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
