// app/customer/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

type Profile = {
  email: string | null;
  full_name: string | null;
  phone: string | null;
  customer_id: string | null;
  created_at: string | null;
};

export default function CustomerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/customer/profile", { cache: "no-store" });
      const js = await res.json();

      if (!res.ok) throw new Error(js.error || "Failed loading profile");

      setProfile(js.profile);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -----------------------------------
  // UI STATES
  // -----------------------------------
  if (loading) {
    return <div className="p-8 text-gray-500 text-sm">Loading…</div>;
  }

  if (err) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Error loading profile: {err}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-gray-600 text-sm">Profile not found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">My Profile</h1>
        <p className="text-gray-600 text-sm">Manage your account and details</p>
      </div>

      <TeslaDivider />

      {/* BASIC INFO */}
      <TeslaSection title="Account Details">
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-[#FAFAFA] rounded-xl border">
            <div className="text-gray-500 text-xs">Full Name</div>
            <div className="text-lg font-medium">
              {profile.full_name || "—"}
            </div>
          </div>

          <div className="p-4 bg-[#FAFAFA] rounded-xl border">
            <div className="text-gray-500 text-xs">Email</div>
            <div className="text-lg font-medium">
              {profile.email || "—"}
            </div>
          </div>

          <div className="p-4 bg-[#FAFAFA] rounded-xl border">
            <div className="text-gray-500 text-xs">Phone</div>
            <div className="text-lg font-medium">
              {profile.phone || "—"}
            </div>
          </div>

          <div className="p-4 bg-[#FAFAFA] rounded-xl border">
            <div className="text-gray-500 text-xs">Customer ID</div>
            <div className="text-lg font-medium">
              {profile.customer_id || "—"}
            </div>
          </div>
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* META */}
      <TeslaSection title="Account Created">
        <div className="p-4 bg-[#FAFAFA] rounded-xl border text-sm">
          {profile.created_at
            ? new Date(profile.created_at).toLocaleString()
            : "—"}
        </div>
      </TeslaSection>

      {/* Back link */}
      <div className="pt-6">
        <Link
            href="/portal"
            className="text-blue-600 underline text-sm"
        >
            ← Back to Portal
        </Link>

      </div>
    </div>
  );
}
