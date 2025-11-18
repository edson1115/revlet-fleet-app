// app/api/images/commit/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { request_id, image_id } = await req.json();

    if (!request_id || !image_id) {
      return NextResponse.json(
        { error: "Missing request_id or image_id" },
        { status: 400 }
      );
    }

    // FIXED: await supabaseServer()
    const supabase = await supabaseServer();

    // FIXED: supabase.auth.getUser()
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch image record
    const { data: img, error: imgErr } = await supabase
      .from("service_request_images")
      .select("*")
      .eq("id", image_id)
      .maybeSingle();

    if (imgErr || !img) {
      return NextResponse.json(
        { error: imgErr?.message || "Image not found" },
        { status: 404 }
      );
    }

    // Commit image to request
    const { error: updErr } = await supabase
      .from("service_request_images")
      .update({ request_id })
      .eq("id", image_id);

    if (updErr) {
      return NextResponse.json(
        { error: updErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
