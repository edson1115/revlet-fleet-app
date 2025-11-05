// app/api/images/commit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CommitBody = {
  id: string;
  blurhash?: string | null;
  size_bytes?: number;     // final measured (optional sanity pass)
  thumb_bytes?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CommitBody;
    const { id, blurhash, size_bytes, thumb_bytes } = body || ({} as any);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: img, error: gErr } = await supabase
      .from("images")
      .select("id, company_id")
      .eq("id", id)
      .single();
    if (gErr || !img) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    // Ensure company scope
    const { data: profile, error: pErr } = await supabase
      .from("profiles").select("company_id").eq("id", user.id).single();
    if (pErr || !profile || profile.company_id !== img.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patch: Record<string, any> = {};
    if (typeof blurhash !== "undefined") patch.blurhash = blurhash;
    if (typeof size_bytes === "number" && size_bytes > 0) patch.size_bytes = size_bytes;
    if (typeof thumb_bytes === "number" && thumb_bytes > 0) patch.thumb_bytes = thumb_bytes;

    if (Object.keys(patch).length) {
      const { error: uErr } = await supabase.from("images").update(patch).eq("id", id);
      if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
