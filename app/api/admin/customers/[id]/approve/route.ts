import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const scope = await resolveUserScope();

  if (!scope.uid || !["ADMIN", "SUPERADMIN"].includes(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("customers")
    .update({
      status: "ACTIVE",
      approved_at: new Date().toISOString(),
      approved_by: scope.uid,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
