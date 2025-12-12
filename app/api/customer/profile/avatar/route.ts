import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // Auth — get current logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 }
      );
    }

    // File extension
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `avatars/${user.id}.${ext}`;

    // Upload using SERVICE ROLE key
    const admin = supabaseAdmin();
    const { error: uploadErr } = await admin.storage
      .from("avatars")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Avatar Upload Error:", uploadErr);
      return NextResponse.json(
        { ok: false, error: uploadErr.message },
        { status: 500 }
      );
    }

    // Update profile table
    await admin
      .from("profiles")
      .update({ avatar_url: filename })
      .eq("id", user.id);

    return NextResponse.json({
      ok: true,
      avatar_url: filename,
    });
  } catch (e: any) {
    console.error("Avatar Upload Failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}
