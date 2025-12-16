import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = supabaseService();
    
    // Read uploaded file
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 }
      );
    }

    // Extension + unique key
    const ext = file.name.split(".").pop();
    const key = `${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // ----------------------------------------------------
    // UPLOAD TO PRIVATE BUCKET (vehicle-health)
    // ----------------------------------------------------
    const { error: uploadError } = await supabase.storage
      .from("vehicle-health") // MUST be private
      .upload(key, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // ----------------------------------------------------
    // RETURN SIGNED URL (valid 2 hours)
    // ----------------------------------------------------
    const { data: signed, error: signErr } = await supabase.storage
      .from("vehicle-health")
      .createSignedUrl(key, 60 * 60 * 2); // 2 hours

    if (signErr) {
      return NextResponse.json(
        { ok: false, error: signErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: signed.signedUrl, // Returned to front-end
      path: key,             // Save to DB
    });
  } catch (e: any) {
  console.error("UPLOAD ERROR:", e);   // ← PRINT REAL ERROR
  return NextResponse.json(
    { ok: false, error: e.message ?? "Unknown server error" },
    { status: 500 }
  );
}

}
