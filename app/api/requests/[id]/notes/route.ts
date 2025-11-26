// app/api/requests/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* --------------------------------------------------------
   Helpers
--------------------------------------------------------- */
async function fetchRequestMarket(supabase: any, requestId: string) {
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      customer:customers(id, market),
      location:locations(id, market),
      technician_id
    `
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) return null;

  const market =
    data.customer?.market ||
    data.location?.market ||
    null;

  return {
    market,
    technician_id: data.technician_id,
    customer_id: data.customer?.id ?? null,
  };
}

/* --------------------------------------------------------
   POST /api/requests/:id/notes
   STAFF + TECH + ADMIN + SUPERADMIN can insert notes
   CUSTOMER cannot insert notes
--------------------------------------------------------- */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const requestMeta = await fetchRequestMarket(supabase, id);
    if (!requestMeta) {
      return NextResponse.json({ error: "request_not_found" }, { status: 404 });
    }

    /* ---------------- Role Validation ---------------- */
    if (scope.isCustomer) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (!scope.isSuper && scope.isInternal) {
      if (!scope.markets.includes(requestMeta.market)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    if (scope.isTech) {
      if (requestMeta.technician_id !== scope.uid) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    /* ---------------- Insert Note ---------------- */
    const payload = await req.json().catch(() => ({} as any));
    const bodyText = String(payload.body ?? payload.text ?? "").trim();

    if (!bodyText) {
      return NextResponse.json({ error: "missing_body" }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from("service_request_notes")
      .insert({
        request_id: id,
        body: bodyText,
        author_id: scope.uid,
      })
      .select("id, body, created_at, author_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: inserted.id,
      body: inserted.body,
      created_at: inserted.created_at,
      author: {
        id: inserted.author_id,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}

/* --------------------------------------------------------
   GET /api/requests/:id/notes
   STAFF + TECH + ADMIN + SUPERADMIN see notes in their markets
   CUSTOMER sees only their own request's notes
--------------------------------------------------------- */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await supabaseServer();
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const requestMeta = await fetchRequestMarket(supabase, id);
    if (!requestMeta) {
      return NextResponse.json({ error: "request_not_found" }, { status: 404 });
    }

    /* ---------------- Role Validation ---------------- */
    if (scope.isSuper) {
      // always allowed
    }
    else if (scope.isCustomer) {
      if (requestMeta.customer_id !== scope.customer_id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    else if (scope.isTech) {
      if (requestMeta.technician_id !== scope.uid) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    else if (scope.isInternal) {
      if (!scope.markets.includes(requestMeta.market)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    else {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    /* ---------------- Fetch Notes ---------------- */
    const { data: notes, error } = await supabase
      .from("service_request_notes")
      .select("id, body, created_at, author_id")
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* ---------------- Fetch Authors ---------------- */
    const authorIds = Array.from(
      new Set(notes.map((n: any) => n.author_id).filter(Boolean))
    );

    let authorMap = new Map<string, any>();

    if (authorIds.length) {
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", authorIds);

      (authors ?? []).forEach((a: any) => {
        authorMap.set(a.id, {
          email: a.email ?? null,
          name: a.full_name ?? null,
        });
      });
    }

    return NextResponse.json({
      rows: notes.map((n: any) => ({
        id: n.id,
        body: n.body,
        created_at: n.created_at,
        author: authorMap.get(n.author_id) ?? { email: null, name: null },
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
  }
}
