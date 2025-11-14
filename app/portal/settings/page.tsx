// app/portal/settings/page.tsx
"use client";

import { useEffect, useState } from "react";

type CustomerProfile = {
  id: string;
  name?: string | null;
  billing_contact?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  secondary_contact?: string | null;
  notes?: string | null;
};

export default function CustomerSettingsPage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;

    (async () => {
      try {
        const res = await fetch("/api/customer/profile", {
          credentials: "include",
          cache: "no-store",
        });
        const js = await res.json();

        if (live) setProfile(js?.profile ?? null);
      } catch {
        if (live) setProfile(null);
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Account Settings</h1>

      {loading ? (
        <div className="text-gray-500">Loading profile…</div>
      ) : !profile ? (
        <div className="text-gray-500">No profile found.</div>
      ) : (
        <div className="rounded-2xl border bg-white divide-y">
          {/* COMPANY NAME */}
          <div className="p-4">
            <div className="text-xs text-gray-500">Company Name</div>
            <div className="text-lg">{profile.name || "—"}</div>
          </div>

          {/* BILLING CONTACT */}
          <div className="p-4">
            <div className="text-xs text-gray-500">Billing Contact</div>
            <div className="text-lg">{profile.billing_contact || "—"}</div>
          </div>

          {/* BILLING EMAIL */}
          <div className="p-4">
            <div className="text-xs text-gray-500">Billing Email</div>
            <div className="text-lg">{profile.billing_email || "—"}</div>
          </div>

          {/* BILLING PHONE */}
          <div className="p-4">
            <div className="text-xs text-gray-500">Billing Phone</div>
            <div className="text-lg">{profile.billing_phone || "—"}</div>
          </div>

          {/* SECONDARY CONTACT */}
          <div className="p-4">
            <div className="text-xs text-gray-500">Secondary Contact</div>
            <div className="text-lg">{profile.secondary_contact || "—"}</div>
          </div>

          {/* NOTES */}
          <div className="p-4">
            <div className="text-xs text-gray-500">Account Notes</div>
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {profile.notes || "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
