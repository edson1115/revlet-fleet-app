// app/api/requests/[id]/notes/[noteId]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// DELETE /api/requests/:id/notes/:noteId
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    const { id, noteId } = await ctx.params;
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Only delete the note that belongs to this request
    const { error } = await supabase
      .from("service_request_notes")
      .delete()
      .eq("id", noteId)
      .eq("request_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
