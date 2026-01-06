import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_KINDS = ["FRONT", "REAR", "LEFT", "RIGHT", "DASH", "OTHER"];

export async function POST(req: Request, context: any) {
  try {
    const requestId = context.params.id;
    if (!requestId) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    // 1. Resolve Scope
    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isCustomer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await supabaseServer();

    // 2. 🔥 HARD ENFORCEMENT: Block actions until approved
    if (scope.role === "CUSTOMER") {
      const { data: customer } = await supabase
        .from("customers")
        .select("status")
        .eq("id", scope.customer_id)
        .single();

      if (customer?.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Account pending approval" },
          { status: 403 }
        );
      }
    }

    // 3. Ensure this request belongs to the logged-in CUSTOMER
    const { data: reqRow, error: reqErr } = await supabase
      .from("service_requests") // Fixed table name from "requests" to "service_requests" based on context
      .select("id, customer_id")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (reqRow.customer_id !== scope.customer_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ... (rest of upload logic remains unchanged)
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "OTHER").toUpperCase();

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (!VALID_KINDS.includes(kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${requestId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("request-images")
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });

    if (uploadErr) {
      console.error(uploadErr);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: signed } = await supabase.storage.from("request-images").getPublicUrl(path);
    const publicUrl = signed?.publicUrl ?? null;

    const { data: img, error: dbErr } = await supabase
      .from("request_images")
      .insert({ request_id: requestId, kind, storage_path: path, url: publicUrl })
      .select()
      .maybeSingle();

    if (dbErr) {
      console.error(dbErr);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, image: img });
  } catch (err: any) {
    console.error("UPLOAD ERROR", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}