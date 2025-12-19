import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — Load notes for a service request (office view)
============================================================ */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isOffice) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("service_request_notes")
      .select(
        `
        id,
        role,
        note,
        created_at
      `
      )
      .eq("request_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      notes: data ?? [],
    });
  } catch (e: any) {
    console.error("Office notes GET error:", e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Add OFFICE internal note
============================================================ */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isOffice) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const note = body?.note?.trim();

    if (!note) {
      return NextResponse.json(
        { ok: false, error: "Note required" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("service_request_notes")
      .insert({
        request_id: id,
        role: "OFFICE",
        note,
      });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Office notes POST error:", e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
