import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

// DELETE: Remove a part
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  const scope = await resolveUserScope();
  const { id: requestId, partId } = await params;

  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  // Perform Delete (Securely scoped to the request)
  const { error } = await supabase
    .from("request_parts")
    .delete()
    .match({ id: partId, request_id: requestId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// PATCH: Edit a part (Qty, Price, Name)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  const scope = await resolveUserScope();
  const { id: requestId, partId } = await params;
  const body = await req.json(); // { part_name, quantity, price }

  if (!scope.uid || scope.role !== "OFFICE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  // Perform Update
  const { error } = await supabase
    .from("request_parts")
    .update({
        part_name: body.part_name,
        quantity: body.quantity,
        price: body.price
    })
    .match({ id: partId, request_id: requestId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}