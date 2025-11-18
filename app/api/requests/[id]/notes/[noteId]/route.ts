// app/api/requests/[id]/notes/[noteId]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string; noteId: string };
type RouteContext = { params: Promise<Params> };

export async function DELETE(_req: Request, context: RouteContext) {
  const { id, noteId } = await context.params;

  const supabase = await supabaseServer();

  // Ensure the note belongs to the correct request
  const { data: note, error: fetchErr } = await supabase
    .from("request_notes")
    .select("*")
    .eq("id", noteId)
    .eq("request_id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json(
      { error: fetchErr.message },
      { status: 400 }
    );
  }

  if (!note) {
    return NextResponse.json(
      { error: "Note not found for this request" },
      { status: 404 }
    );
  }

  // Delete the note
  const { error: deleteErr } = await supabase
    .from("request_notes")
    .delete()
    .eq("id", noteId);

  if (deleteErr) {
    return NextResponse.json(
      { error: deleteErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Note deleted" }, { status: 200 });
}
