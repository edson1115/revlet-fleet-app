import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole, INTERNAL } from "@/lib/supabase/server-helpers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, role } = await getUserAndRole();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("service_requests")
      .update({
        tech_id: body.tech_id ?? null,
        eta_start: body.eta_start ?? null,
        eta_end: body.eta_end ?? null,
        status: "SCHEDULED",
      })
      .eq("id", params.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
