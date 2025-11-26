// app/api/requests/[id]/photos/[photoId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: requestId, photoId } = await ctx.params;
  const supabase = await supabaseServer();

  // 1) Lookup DB row
  const { data: row } = await supabase
    .from("request_photos")
    .select("id, url")
    .eq("id", photoId)
    .maybeSingle();

  if (!row) {
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  // Extract path: everything after the bucket URL
  const url = row.url;
  const idx = url.indexOf("/request_photos/");
  const path = url.substring(idx + "/request_photos/".length);

  // 2) Delete storage file
  await supabase.storage.from("request_photos").remove([path]);

  // 3) Delete DB row
  await supabase.from("request_photos").delete().eq("id", photoId);

  return NextResponse.json({ ok: true });
}
