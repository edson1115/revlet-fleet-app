import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const admin = supabaseAdmin();

    // 1 — Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2 — Get uploaded file
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    // 3 — Upload to bucket
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;

    const upload = await admin.storage
      .from("public")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (upload.error) {
      return NextResponse.json(
        { error: upload.error.message },
        { status: 500 }
      );
    }

    // Public URL
    const publicUrl = admin.storage.from("public").getPublicUrl(path).data.publicUrl;

    // 4 — Save avatar URL to profile
    await admin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    return NextResponse.json({ ok: true, avatar_url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
