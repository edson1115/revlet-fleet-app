// app/api/admin/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const fallback = "edson.cortes@bigo.com";
  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

function ok(data: any) {
  return NextResponse.json({ ok: true, data });
}
function fail(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export const dynamic = "force-dynamic";

async function getCaller() {
  const supabase = await supabaseServer();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return { error: "unauthorized" as const };
  }
  const uid = auth.user.id;
  const email = auth.user.email || null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", uid)
    .maybeSingle();

  const meta = (auth.user.user_metadata ?? {}) as Record<string, any>;
  const role = (prof?.role ?? meta?.role ?? "").toString().toUpperCase();
  const callerCompanyId = prof?.company_id ?? meta?.company_id ?? null;
  const isSuper = isSuperAdminEmail(email);
  const isAdmin = isSuper || role === "ADMIN";

  return {
    supabase,
    uid,
    email,
    isSuper,
    isAdmin,
    callerCompanyId,
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await context.params;

  const caller = await getCaller();
  if ("error" in caller) return fail("unauthorized", 401);

  const { supabase, isSuper, isAdmin, callerCompanyId } = caller;

  const { data: customer, error } = await supabase
    .from("company_customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!customer) return fail("not_found", 404);

  // tenant guard
  if (
    !isSuper &&
    isAdmin &&
    callerCompanyId &&
    customer.company_id &&
    customer.company_id !== callerCompanyId
  ) {
    return fail("forbidden", 403);
  }

  return ok(customer);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await context.params;
  if (!customerId) return fail("missing_id", 400);

  const caller = await getCaller();
  if ("error" in caller) return fail("unauthorized", 401);

  const { supabase, isSuper, isAdmin, callerCompanyId } = caller;

  if (!isAdmin) return fail("forbidden", 403);

  const body = await req.json().catch(() => ({}));
  const {
    name,
    company_id,
    location_id,
    account_number,
    contact_name,
    contact_phone,
  } = body as {
    name?: string;
    company_id?: string | null;
    location_id?: string | null;
    account_number?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
  };

  // load existing to enforce tenant boundary
  const { data: existing, error: loadErr } = await supabase
    .from("company_customers")
    .select("id, company_id")
    .eq("id", customerId)
    .maybeSingle();

  if (loadErr) return fail(loadErr.message, 500);
  if (!existing) return fail("customer_not_found", 404);

  if (
    !isSuper &&
    callerCompanyId &&
    existing.company_id &&
    existing.company_id !== callerCompanyId
  ) {
    return fail("forbidden_out_of_tenant", 403);
  }

  const update: Record<string, any> = {};
  if (typeof name === "string") update.name = name.trim();
  if (typeof company_id !== "undefined") update.company_id = company_id;
  if (typeof location_id !== "undefined") update.location_id = location_id;
  if (typeof account_number !== "undefined") update.account_number = account_number;
  if (typeof contact_name !== "undefined") update.contact_name = contact_name;
  if (typeof contact_phone !== "undefined") update.contact_phone = contact_phone;

  if (Object.keys(update).length === 0) {
    return ok({ id: customerId, unchanged: true });
  }

  const { data: updated, error: upErr } = await supabase
    .from("company_customers")
    .update(update)
    .eq("id", customerId)
    .select()
    .maybeSingle();

  if (upErr) return fail(upErr.message, 500);
  return ok(updated);
}


export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await context.params;
  if (!customerId) return fail("missing_id", 400);

  const caller = await getCaller();
  if ("error" in caller) return fail("unauthorized", 401);

  const { supabase, isSuper, isAdmin, callerCompanyId } = caller;
  if (!isSuper) return fail("forbidden_superadmin_only", 403);

  const { data: existing, error: loadErr } = await supabase
    .from("company_customers")
    .select("id, company_id, name")
    .eq("id", customerId)
    .maybeSingle();

  if (loadErr) return fail(loadErr.message, 500);
  if (!existing) return fail("customer_not_found", 404);

  const { error: delErr } = await supabase
    .from("company_customers")
    .delete()
    .eq("id", customerId);

  if (delErr) return fail(delErr.message, 500);

  return ok({ deleted_id: customerId });
}
