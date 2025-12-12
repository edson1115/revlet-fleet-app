"use client";

import { useEffect, useState } from "react";
import { TeslaProfileCard } from "@/components/tesla/customer/TeslaProfileCard";
import { TeslaProfileField } from "@/components/tesla/customer/TeslaProfileField";

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/customer/profile", { cache: "no-store" });
    const js = await res.json();
    if (js.ok) setProfile(js.profile);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          My Profile
        </h1>

        {loading && (
          <div className="text-gray-500 text-center py-8">Loading…</div>
        )}

        {!loading && profile && (
          <TeslaProfileCard>
            <TeslaProfileField label="Full Name" value={profile.full_name} />
            <TeslaProfileField label="Email" value={profile.email} />
            <TeslaProfileField label="Phone" value={profile.phone} />
            <TeslaProfileField label="Company" value={profile.company} />
            <TeslaProfileField label="Fleet Size" value={profile.fleet_size} />
          </TeslaProfileCard>
        )}
      </div>
    </div>
  );
}
