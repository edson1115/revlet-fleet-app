import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function GET(req: Request, { params }: any) {
  const { id } = await params; // Next.js 15 await params
  const scope = await resolveUserScope();
  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();
  
  // Fetch Request Detail for Tech
  const { data, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customers(name, address, phone),
      vehicle:vehicles(year, make, model, plate, unit_number, vin),
      request_parts(*)
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, request: data });
}

export async function PATCH(req: Request, { params }: any) {
  const { id } = await params;
  const scope = await resolveUserScope();
  
  // Allow Tech OR Office to update
  if (!scope.uid || !["TECH", "OFFICE", "ADMIN", "SUPERADMIN"].includes(scope.role)) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = await supabaseServer();

  // If status is changing to IN_PROGRESS, maybe set started_at? (Optional logic here)
  
  const { data, error } = await supabase
    .from("service_requests")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, request: data });
}