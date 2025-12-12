import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req: Request, { params }: any) {
  try {
    const supabase = await supabaseServer();
    const leadId = params.id;

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const role = user.user_metadata?.role;
    if (role !== "OUTSIDE_SALES")
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    // Parse form-data upload
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file)
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });

    const ext = file.name.split(".").pop();
    const filename = `${leadId}/${randomUUID()}.${ext}`;

    // Upload to storage bucket
    const { error: uploadErr } = await supabase.storage
      .from("visit_photos")
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    // Get URL
    const { data: urlData } = supabase.storage
      .from("visit_photos")
      .getPublicUrl(filename);

    // Attach to DB record
    await supabase.from("sales_lead_updates").insert({
      lead_id: leadId,
      update_type: "VISIT_PHOTO",
      meta: { url: urlData.publicUrl, filename },
      created_by: user.id,
    });

    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
