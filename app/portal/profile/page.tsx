import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase text-gray-500 tracking-wide">{label}</div>
      <div className="text-base">{value || "—"}</div>
    </div>
  );
}

export default async function CustomerProfilePage() {
  const supabase = await supabaseServer();

  // AUTH
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  // FIND CUSTOMER RECORD LINKED TO THIS PROFILE
  const { data: cust, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      billing_contact,
      billing_email,
      billing_phone,
      secondary_contact,
      notes
    `
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cust || error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">My Profile</h1>

        <div className="text-sm text-red-600">
          No customer record associated with this user.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <h1 className="text-2xl font-semibold">Account Profile</h1>

      {/* SUMMARY CARD */}
      <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-6">
        <Field label="Company Name" value={cust.name} />
        <Field label="Billing Contact" value={cust.billing_contact} />
        <Field label="Billing Email" value={cust.billing_email} />
        <Field label="Billing Phone" value={cust.billing_phone} />
        <Field label="Secondary Contact" value={cust.secondary_contact} />

        <div>
          <div className="text-xs uppercase text-gray-500 tracking-wide mb-1">Notes</div>
          <div className="whitespace-pre-wrap text-base">{cust.notes || "—"}</div>
        </div>
      </div>

      {/* EDIT BUTTON */}
      <div>
        <a
          href="/portal/profile/edit"
          className="inline-block px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
        >
          Edit Profile
        </a>
      </div>
    </div>
  );
}
