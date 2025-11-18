// app/api/requests/[id]/photos/[photoId]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function DELETE(req: Request, context: any) {
  const { id: requestId, photoId } = context.params || {};
  if (!requestId || !photoId) {
    return NextResponse.json(
      { error: "Missing requestId or photoId" },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // 1) Delete DB row (service_request_images table)
  const { error: dbErr } = await supabase
    .from("service_request_images")
    .delete()
    .eq("id", photoId)
    .eq("request_id", requestId);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 400 });
  }

  // 2) Delete from storage (optional, if you’re storing as requestId/photoId)
  const { error: storageErr } = await supabase.storage
    .from("request-images")
    .remove([`${requestId}/${photoId}`]);

  if (storageErr) {
    // DB row is already gone, but we surface the storage error
    return NextResponse.json(
      { error: storageErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
