// app/vehicles/new/page.tsx
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Resolve company_id for current user: profiles → /api/me (metadata). */
async function resolveCompanyId() {
  const supabase = await supabaseServer();

  // Try profiles.company_id (ignore if table missing)
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id || null;

    if (userId) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();

      if (!error && profile?.company_id) return profile.company_id as string;
    }
  } catch {
    // profiles may not exist; ignore
  }

  // Fallback to /api/me (which also reads user_metadata.company_id)
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.ok) {
      const me = await res.json();
      if (me?.company_id) return me.company_id as string;
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** Ensure return URL is an internal path; default to /fm/requests/new */
function computeReturnUrl(params: Record<string, string | string[] | undefined>) {
  const raw = params?.return;
  const ret = Array.isArray(raw) ? raw[0] : raw;
  if (typeof ret === "string" && ret.startsWith("/")) return ret;
  return "/fm/requests/new";
}

/** Server action: insert vehicle, then redirect to return URL with ?vehicle_id=<id>.
 *  If duplicate unit_number is detected, redirect back to /vehicles/new with a friendly banner.
 */
async function createVehicle(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();

  // read the return url the page was opened with (hidden field)
  const returnUrl = String(formData.get("__return") || "/fm/requests/new");

  if (!company_id) {
    throw new Error(
      "Missing company context. Set user_metadata.company_id (fast) or create profiles.company_id (recommended)."
    );
  }

  const year = Number(formData.get("year")) || null;
  const make = String(formData.get("make") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const vin = String(formData.get("vin") || "").trim() || null;
  const plate = String(formData.get("plate") || "").trim() || null;
  const unit_numberRaw = String(formData.get("unit_number") || "");
  const unit_number = unit_numberRaw.trim() === "" ? null : unit_numberRaw.trim();

  // Pre-check duplicate (company_id, unit_number) if provided
  if (unit_number) {
    const { data: existing } = await supabase
      .from("vehicles")
      .select("id")
      .eq("company_id", company_id)
      .eq("unit_number", unit_number)
      .maybeSingle();

    if (existing?.id) {
      const url = new URL("/vehicles/new", "http://localhost");
      url.searchParams.set("return", returnUrl);
      url.searchParams.set("dup", "1");
      url.searchParams.set("unit", unit_number);
      redirect(url.pathname + "?" + url.searchParams.toString());
    }
  }

  // Insert and RETURN the id so we can preselect it on the next page
  const { data, error } = await supabase
    .from("vehicles")
    .insert([{ company_id, year, make, model, vin, plate, unit_number }])
    .select("id")
    .single();

  if (error) {
    // Gracefully handle Postgres unique_violation (23505) even if it slipped past pre-check
    if ((error as any).code === "23505") {
      const url = new URL("/vehicles/new", "http://localhost");
      url.searchParams.set("return", returnUrl);
      url.searchParams.set("dup", "1");
      if (unit_number) url.searchParams.set("unit", unit_number);
      redirect(url.pathname + "?" + url.searchParams.toString());
    }
    console.error(error);
    throw new Error(error.message);
  }

  const newId = data?.id as string;
  revalidatePath(returnUrl);

  const url = new URL(returnUrl, "http://localhost"); // base ignored by Next redirect
  url.searchParams.set("vehicle_id", newId);
  url.searchParams.set("added_vehicle", "1");

  redirect(url.pathname + "?" + url.searchParams.toString());
}

/** Page */
export default async function NewVehiclePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ Next 15: await searchParams
  const params = await props.searchParams;
  const company_id = await resolveCompanyId();
  const returnTo = computeReturnUrl(params);

  const isDup = params?.dup === "1";
  const dupUnit = (Array.isArray(params?.unit) ? params?.unit[0] : params?.unit) || "";

  if (!company_id) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Add Vehicle</h1>
        <div className="rounded border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
          We couldn’t detect your <code>company_id</code>. Quick fix: add{" "}
          <code>{"{\"company_id\":\"00000000-0000-0000-0000-000000000002\"}"}</code> to your user’s{" "}
          <b>User Metadata</b> in Supabase Auth. Recommended: create a <code>profiles</code> table and
          store <code>company_id</code> there (see migration file).
        </div>
        <div className="flex gap-3">
          <Link href={returnTo} className="px-3 py-2 rounded border">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Add Vehicle</h1>

      {/* Duplicate banner */}
      {isDup && (
        <div className="rounded border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
          A vehicle with unit number <b>{dupUnit}</b> already exists for this company. Choose a different unit
          number or leave it blank.
        </div>
      )}

      <form action={createVehicle} className="space-y-4">
        {/* keep the return target across submit */}
        <input type="hidden" name="__return" value={returnTo} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Year</label>
            <input name="year" type="number" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Make</label>
            <input name="make" required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Model</label>
            <input name="model" required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit #</label>
            <input name="unit_number" className="w-full border rounded px-3 py-2" defaultValue={dupUnit} />
          </div>
          <div>
            <label className="block text-sm mb-1">Plate</label>
            <input name="plate" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">VIN</label>
            <input name="vin" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 rounded bg-black text-white hover:opacity-80">
            Save vehicle
          </button>
          <Link href={returnTo} className="px-4 py-2 rounded border">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
