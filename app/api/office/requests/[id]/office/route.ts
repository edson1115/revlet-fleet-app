import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scope = await resolveUserScope();

    if (!scope.isOffice && !scope.isAdmin && !scope.isSuperadmin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("service_requests")
      .update({
        approval_number: body.approval_number ?? null,
        invoice_number: body.invoice_number ?? null,
        office_notes: body.office_notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
