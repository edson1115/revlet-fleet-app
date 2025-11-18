// app/api/customers/[id]/recurring/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/rbac/getRole";

export async function POST(req: NextRequest, { params }: any) {
  const customerId = params.id;
  const supabase = await supabaseServer();
  const role = await getUserRole();

  if (!["OFFICE", "FM", "SUPERADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { frequency, weekday, day_of_month } = body;

  const { data, error } = await supabase
    .from("recurring_inspections")
    .insert({
      customer_id: customerId,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      frequency,
      weekday,
      day_of_month,
      next_run: calculateNextRun(frequency, weekday, day_of_month),
    })
    .select()
    .single();

  return NextResponse.json({ data, error });
}

function calculateNextRun(
  frequency: string,
  weekday?: number,
  dom?: number
): string {
  const now = new Date();

  if (frequency === "WEEKLY" && weekday !== undefined) {
    const date = new Date();
    const diff = (weekday + 7 - date.getDay()) % 7;
    date.setDate(date.getDate() + diff || 7);
    return date.toISOString();
  }

  if (frequency === "MONTHLY" && dom) {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(dom);
    return date.toISOString();
  }

  if (frequency === "QUARTERLY") {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString();
  }

  // fallback = 7 days
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}
