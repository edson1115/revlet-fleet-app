// app/api/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // you already have this
import { resolveUserScope } from "@/lib/api/scope";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const scope = await resolveUserScope();
  if (!scope.uid) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const request_id = form.get("request_id") as string | null;
  const kind = (form.get("kind") as string | null) ?? "before";

  if (!file) {
    return NextResponse.json(
      { ok: false, error: "No file uploaded" },
      { status: 400 }
    );
  }

  if (!request_id) {
    return NextResponse.json(
      { ok: false, error: "Missing request_id" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Convert to ArrayBuffer → Buffer
  const buf = Buffer.from(await file.arrayBuffer());

  const ext = file.type.includes("png") ? "png" : "jpg";
  const id = randomUUID();
  const path = `requests/${request_id}/${id}.${ext}`;

  // Upload to bucket
  const { error: upErr } = await supabase.storage
    .from("images")
    .upload(path, buf, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    console.error("Upload failed:", upErr);
    return NextResponse.json(
      { ok: false, error: upErr.message },
      { status: 500 }
    );
  }

  // Get public URLs
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(path);

  // Insert DB metadata
  const { data: image, error: insertErr } = await supabase
    .from("images")
    .insert({
      id,
      request_id,
      uploader_id: scope.uid,
      kind,
      url_thumb: publicUrl,
      url_work: publicUrl,
      ai_labels: [],
      ai_damage_detected: false,
    })
    .select("*")
    .maybeSingle();

  if (insertErr) {
    console.error("Insert image row failed:", insertErr);
    return NextResponse.json(
      { ok: false, error: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, image });
}
