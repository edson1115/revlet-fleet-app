// app/api/requests/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const sb = await supabaseServer();

    const { data, error } = await sb
      .from("request_notes")
      .select(`
        id, request_id, author_id, body, created_at,
        author:author_id ( id, full_name, email )
      `)
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
    return NextResponse.json({ rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ rows: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { id } = await ctx.params;
    const { body } = await req.json().catch(() => ({ body: "" }));
    const sb = await supabaseServer();

    if (!body || !String(body).trim()) {
      return NextResponse.json({ error: "Note body required." }, { status: 400 });
    }

    // Current user as author
    const { data: auth } = await sb.auth.getUser();
    const author_id = auth.user?.id || null;
    if (!author_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await sb
      .from("request_notes")
      .insert([{ request_id: id, author_id, body: String(body).trim() }])
      .select(`
        id, request_id, author_id, body, created_at,
        author:author_id ( id, full_name, email )
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ note: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
