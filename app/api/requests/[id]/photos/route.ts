import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req, { params }) {
  const requestId = params.id;
  const supabase = supabaseServer();

  const form = await req.formData();
  const file = form.get("file");
  const kind = form.get("kind"); // before | after

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${requestId}/${crypto.randomUUID()}.${ext}`;

  // Upload to bucket
  const { error: uploadError } = await supabase.storage
    .from("work-photos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error(uploadError);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("work-photos").getPublicUrl(fileName);

  // Insert DB record
  const { error: insertError } = await supabase
    .from("request_photos")
    .insert({
      request_id: requestId,
      kind,
      url: publicUrl,
    });

  if (insertError) {
    console.error(insertError);
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: publicUrl });
}
