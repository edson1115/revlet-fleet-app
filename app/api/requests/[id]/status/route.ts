// app/api/requests/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

const VALID_STATUSES = [
  "NEW",
  "WAITING_TO_BE_SCHEDULED",
  "SCHEDULED",
  "IN_PROGRESS",
  "WAITING_APPROVAL",
  "WAITING_PARTS",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const body = await req.json();
  const newStatus = body?.status;

  // 1. Validate status
  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      {
        error: "Invalid status",
        allowed: VALID_STATUSES,
      },
      { status: 400 }
    );
  }

  // 2. Update status
  const { data, error } = await supabase
    .from("requests")
    .update({
      status: newStatus,
      status_updated_at: new Date().toISOString(),
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
      message: `Status updated to ${newStatus}`,
      request: data,
    },
    { status: 200 }
  );
}
