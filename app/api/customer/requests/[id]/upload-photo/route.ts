import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ALLOWED ENUM VALUES from your DB:
// FRONT | REAR | LEFT | RIGHT | DASH | OTHER
const VALID_KINDS = ["FRONT", "REAR", "LEFT", "RIGHT", "DASH", "OTHER"];

// -----------------------------------------------------------
// POST /api/customer/requests/:id/upload-photo
// Body: multipart/form-data → { file, kind }
// -----------------------------------------------------------
export async function POST(req: Request, context: any) {
  try {
    const requestId = context.params.id;
    if (!requestId) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    // -------------------------------------------------------
    // AUTH — CUSTOMER OR INTERNAL STAFF
    // -------------------------------------------------------
    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    // -------------------------------------------------------
    // Ensure this request belongs to the logged-in CUSTOMER
    // -------------------------------------------------------
    const { data: reqRow, error: reqErr } = await supabase
      .from("requests")
      .select("id, customer_id")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (reqRow.customer_id !== scope.customer_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -------------------------------------------------------
    // Parse form-data (file + kind)
    // -------------------------------------------------------
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "OTHER").toUpperCase();

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!VALID_KINDS.includes(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    // -------------------------------------------------------
    // Upload to Supabase Storage
    // -------------------------------------------------------
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${requestId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("request-images")
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error(uploadErr);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get the signed URL
    const { data: signed } = await supabase.storage
      .from("request-images")
      .getPublicUrl(path);

    const publicUrl = signed?.publicUrl ?? null;

    // -------------------------------------------------------
    // Insert DB row into request_images
    // -------------------------------------------------------
    const { data: img, error: dbErr } = await supabase
      .from("request_images")
      .insert({
        request_id: requestId,
        kind,
        storage_path: path,
        url: publicUrl,
      })
      .select()
      .maybeSingle();

    if (dbErr) {
      console.error(dbErr);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, image: img });
  } catch (err: any) {
    console.error("UPLOAD ERROR", err);
    return NextResponse.json(
      { error: String(err.message || err) },
      { status: 500 }
    );
  }
}
