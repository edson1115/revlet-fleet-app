import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole, INTERNAL } from "@/lib/supabase/server-helpers";

type Action = "APPROVE" | "REJECT" | "HOLD";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, role } = await getUserAndRole();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, request: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, role } = await getUserAndRole();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!role || !INTERNAL.has(role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const action = (body.action || "").toUpperCase() as Action;
    const notes = body.notes ?? null;
    const priority = body.priority ?? null;

    const supabase = await supabaseServer();

    // Decide status transitions
    let nextStatus: string | null = null;
    if (action === "APPROVE") nextStatus = "WAITING"; // → later Dispatch will schedule
    if (action === "REJECT") nextStatus = "CANCELLED";
    if (action === "HOLD") nextStatus = "WAITING_FOR_APPROVAL";

    const patch: any = {};
    if (nextStatus) patch.status = nextStatus;
    if (notes !== undefined) patch.office_notes = notes; // adjust column if yours is different
    if (priority !== undefined) patch.priority = priority;

    const { error } = await supabase
      .from("service_requests")
      .update(patch)
      .eq("id", params.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
