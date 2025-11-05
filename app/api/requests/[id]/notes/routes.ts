// app/api/requests/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/requests/:id/notes  { body: string }  (accepts legacy { text } too)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const payload = await req.json().catch(() => ({} as any));
    // normalize to `body`
    const bodyText = String(payload?.body ?? payload?.text ?? "").trim();
    if (!bodyText) return NextResponse.json({ error: "missing_body" }, { status: 400 });

    // insert with author_id
    const { data: inserted, error } = await supabase
      .from("service_request_notes")
      .insert([{ request_id: id, body: bodyText, author_id: auth.user.id }])
      .select("id, body, created_at, author_id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // enrich author email (optional)
    const { data: author } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", inserted.author_id)
      .maybeSingle();

    return NextResponse.json({
      id: inserted.id,
      body: inserted.body,
      created_at: inserted.created_at,
      author: author ? { email: author.email ?? null } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

// GET /api/requests/:id/notes → newest first
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("service_request_notes")
      .select("id, body, created_at, author_id")
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // fetch authors in one go
    const authorIds = Array.from(new Set((data ?? []).map(r => r.author_id).filter(Boolean)));
    let emailMap = new Map<string, string | null>();
    if (authorIds.length) {
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", authorIds);
      emailMap = new Map((authors ?? []).map(a => [a.id as string, (a as any).email ?? null]));
    }

    return NextResponse.json({
      rows: (data ?? []).map(n => ({
        id: n.id,
        body: n.body,                   // <-- consistent key
        created_at: n.created_at,
        author: n.author_id ? { email: emailMap.get(n.author_id) ?? null } : null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
