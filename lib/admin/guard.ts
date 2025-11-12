// lib/admin/guard.ts
export function isSuperAdminEmail(email?: string | null) {
  const envList = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Hard fallback for your account
  const fallback = "edson.cortes@bigo.com";

  const e = (email || "").toLowerCase();
  return !!e && (envList.includes(e) || e === fallback);
}

export async function requireSuper(supabase: any) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  const email = auth?.user?.email || null;

  if (!uid) return { ok: false, status: 401, error: "unauthorized" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  const role = String(
    prof?.role || (isSuperAdminEmail(email) ? "SUPERADMIN" : "")
  ).toUpperCase();

  if (role !== "SUPERADMIN") {
    return { ok: false, status: 403, error: "forbidden" };
  }

  return { ok: true, email: email || undefined };
}
