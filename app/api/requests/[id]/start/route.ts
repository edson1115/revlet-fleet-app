// app/api/requests/[id]/start/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  let body: {
    technician_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { technician_id } = body;

  const { data, error } = await supabase
    .from("requests")
    .update({
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
      technician_id: technician_id ?? null,
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
      message: "Request marked as IN_PROGRESS",
      request: data,
    },
    { status: 200 }
  );
}
