import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function DELETE(req, { params }) {
  const { id: requestId, photoId } = params;
  const supabase = supabaseServer();

  // 1. Get photo record so we know the file path
  const { data: photo, error: fetchError } = await supabase
    .from("request_photos")
    .select("*")
    .eq("id", photoId)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Extract file path from URL
  const path = photo.url.split("/work-photos/")[1];

  // 2. Delete from bucket
  if (path) {
    await supabase.storage.from("work-photos").remove([path]);
  }

  // 3. Delete from DB
  await supabase.from("request_photos").delete().eq("id", photoId);

  return NextResponse.json({ success: true });
}
