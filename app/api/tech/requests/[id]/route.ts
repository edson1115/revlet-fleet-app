import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserAndRole } from "@/lib/supabase/server-helpers";

export async function PATCH(req: Request, { params }: any) {
  const { user, role } = await getUserAndRole();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (role !== "TECH") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const supabase = await supabaseServer();

  const contentType = req.headers.get("content-type") ?? "";

  // ---- JSON actions (START) ----
  if (contentType.includes("application/json")) {
    const body = await req.json();

    if (body.action === "START") {
      await supabase
        .from("service_requests")
        .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
        .eq("id", params.id);

      return NextResponse.json({ ok: true });
    }
  }

  // ---- Multipart actions (COMPLETE) ----
  const form = await req.formData();
  const action = form.get("action");

  if (action === "COMPLETE") {
    // update DB
    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        parts_used: form.get("parts_used"),
        notes: form.get("notes"),
      })
      .eq("id", params.id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
}
