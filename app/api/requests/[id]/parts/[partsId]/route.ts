import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; partId: string } }
) {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("service_request_parts")
    .delete()
    .eq("id", params.partId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
