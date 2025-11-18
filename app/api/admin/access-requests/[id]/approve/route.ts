import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import type { Role } from "@/lib/rbac";

//
// 🔵 GET — List pending access requests
//
export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("access_requests")
    .select("id, email, name, requested_role, created_at")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ rows: data ?? [] });
}

//
// 🟢 PATCH — Approve or modify an access request
//
export async function PATCH(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json().catch(() => ({}));

  const {
    id,
    role,
    customer_id,
    invite,
  }: {
    id: string;
    role: Role;
    customer_id?: string | null;
    invite?: boolean;
  } = body;

  if (!id || !role) {
    return NextResponse.json(
      { error: "Missing id or role" },
      { status: 400 }
    );
  }

  // Update access request status
  const { error: updateError } = await supabase
    .from("access_requests")
    .update({
      status: "APPROVED",
      approved_role: role,
      approved_customer_id: customer_id ?? null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 }
    );
  }

  // (Optional) AUTO-SEND INVITE EMAIL (we'll build later)
  if (invite) {
    console.log("Invite requested — will implement email after MVP.");
  }

  return NextResponse.json({ success: true });
}
