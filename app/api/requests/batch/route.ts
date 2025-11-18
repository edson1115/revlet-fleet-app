// app/api/requests/batch/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const jar = await cookies();

  // Supabase SSR client – correct cookie block for Next.js 15
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            jar.set(cookie);
          }
        },
      },
    }
  );

  const body = await req.json().catch(() => null);
  if (!body?.ids || !Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Missing ids[]" }, { status: 400 });
  }

  const ids: string[] = body.ids;

  const updates: Record<string, any> = {};
  if ("status" in body) updates.status = body.status;
  if ("scheduled_at" in body) updates.scheduled_at = body.scheduled_at;
  if ("technician_id" in body) updates.technician_id = body.technician_id;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid updatable fields found" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("service_requests")
    .update(updates)
    .in("id", ids);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
