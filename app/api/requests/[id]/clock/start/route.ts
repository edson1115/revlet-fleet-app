// app/api/requests/[id]/clock/start/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function PATCH(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("requests")
    .update({
      clock_started_at: now,
      status: "IN_PROGRESS",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      message: "Clock started",
      started_at: now,
      request: data,
    },
    { status: 200 }
  );
}
