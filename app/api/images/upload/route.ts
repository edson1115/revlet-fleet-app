// app/api/images/upload/route.ts
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // no caching
export const runtime = "nodejs";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!url || !key) throw new Error("Supabase env vars missing: SUPABASE_SERVICE_ROLE");
  return createClient(url, key, { auth: { persistSession: false } });
}

function extFromType(t?: string | null) {
  if (!t) return "bin";
  const s = t.toLowerCase();
  if (s.includes("jpeg")) return "jpg";
  if (s.includes("png")) return "png";
  if (s.includes("webp")) return "webp";
  if (s.includes("heic")) return "heic";
  if (s.includes("heif")) return "heif";
  return "bin";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    // accept "file", "image", or "files" (take the first)
    let file = (form.get("file") as File | null) || (form.get("image") as File | null);
    if (!file) {
      const files = form.getAll("files").filter((f) => f instanceof File) as File[];
      file = files[0] || null;
    }

    const request_id = (form.get("request_id") as string | null)?.trim();
    const kind = ((form.get("kind") as string | null) || "other").trim(); // before|after|other

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!request_id) return NextResponse.json({ error: "Missing request_id" }, { status: 400 });

    const BUCKET = process.env.NEXT_PUBLIC_IMAGES_BUCKET || "work-photos";
    const sb = supabaseAdmin();

    const contentType = file.type || "application/octet-stream";
    const ext = extFromType(contentType);
    const ts = Date.now();
    const objectName = `${request_id}/${ts}-${kind}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await sb.storage.from(BUCKET).upload(objectName, Buffer.from(arrayBuffer), {
      contentType,
      upsert: false,
    });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(objectName);
    const url_work = pub?.publicUrl || null;

    return NextResponse.json({
      ok: true,
      file: { request_id, kind, object: objectName, contentType, url_work, url_thumb: url_work },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 400 });
  }
}

// Optional: quick GET ping for easy route verification in browser
export async function GET() {
  return NextResponse.json({ ok: true, expects: "POST multipart/form-data with file|image|files[]" });
}
