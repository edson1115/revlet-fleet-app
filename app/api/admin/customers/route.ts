// app/api/admin/customers/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Load the user's profile (to determine company)
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", uid)
    .maybeSingle();

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  const role = String(prof?.role || "").toUpperCase();
  const isAdmin = ["ADMIN", "SUPERADMIN", "OFFICE"].includes(role);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { name, location_id, account_number, contact_name, contact_phone } = body ?? {};

  if (!name?.trim()) {
    return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  }

  const company_id = prof?.company_id ?? null;
  if (!company_id) {
    return NextResponse.json({ error: "No company associated with this profile." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("company_customers")
    .insert([
      {
        name: name.trim(),
        company_id,
        location_id: location_id || null,
        account_number: account_number || null,
        contact_name: contact_name || null,
        contact_phone: contact_phone || null,
      },
    ])
    .select("id, name, company_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, data });
}
