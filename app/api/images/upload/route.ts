// app/api/images/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

  // BEFORE | AFTER | OTHER
  const kind = (form.get("kind") as string | null)?.toLowerCase() || "before";
  const allowedKinds = ["before", "after", "other"];

  if (!allowedKinds.includes(kind)) {
    return NextResponse.json(
      { ok: false, error: "Invalid kind. Must be before|after|other" },
      { status: 400 }
    );
  }

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

  // 🚧 Validate tech owns this request (good security)
  const { data: srCheck, error: srErr } = await supabase
    .from("service_requests")
    .select("id, technician_id")
    .eq("id", request_id)
    .maybeSingle();

  if (srErr || !srCheck) {
    return NextResponse.json(
      { ok: false, error: "Invalid request_id" },
      { status: 404 }
    );
  }

  if (scope.isTech && srCheck.technician_id !== scope.uid) {
    return NextResponse.json(
      { ok: false, error: "Not authorized for this request" },
      { status: 403 }
    );
  }

  // Convert to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Choose extension based on MIME
  const mime = file.type.toLowerCase();
  const ext = mime.includes("png") ? "png" : "jpg";

  const id = randomUUID();
  const filename = `${id}.${ext}`;
  const path = `requests/${request_id}/${kind}/${filename}`;

  // Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from("images")
    .upload(path, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadErr) {
    console.error("Upload failed:", uploadErr);
    return NextResponse.json(
      { ok: false, error: uploadErr.message },
      { status: 500 }
    );
  }

  // Generate public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(path);

  // Insert into request_images (correct table)
  const { data: image, error: insertErr } = await supabase
    .from("request_images")
    .insert({
      id,
      request_id,
      uploader_id: scope.uid,
      kind, // "before" | "after" | "other"
      path,
      url_thumb: publicUrl,
      url_work: publicUrl,
      ai_labels: [],
      ai_damage_detected: false,
    })
    .select("*")
    .maybeSingle();

  if (insertErr) {
    console.error("Image row insert failed:", insertErr);
    return NextResponse.json(
      { ok: false, error: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, image });
}



