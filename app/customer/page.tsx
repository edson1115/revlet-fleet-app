// app/customer/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total_requests: 0,
    open_requests: 0,
    completed_requests: 0,
    vehicles: 0,
  });

  async function load() {
    try {
      const res = await fetch("/api/customer/dashboard", {
        cache: "no-store",
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed to load dashboard");

      setStats(js.stats);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500 text-sm">Loading…</div>;
  }

  if (err) {
    return (
      <div className="p-8 text-red-600 text-sm">
        Error loading dashboard: {err}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Customer Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          Overview of your vehicles & service activity
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TeslaServiceCard title="Total Requests">
          <div className="text-3xl font-semibold">
            {stats.total_requests}
          </div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Open Requests">
          <div className="text-3xl font-semibold">
            {stats.open_requests}
          </div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Completed">
          <div className="text-3xl font-semibold">
            {stats.completed_requests}
          </div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Vehicles">
          <div className="text-3xl font-semibold">
            {stats.vehicles}
          </div>
        </TeslaServiceCard>
      </div>

      <TeslaDivider />

      {/* QUICK LINKS */}
      <TeslaSection title="Quick Access">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

          <Link
            href="/customer/requests"
            className="block p-4 rounded-xl border bg-[#FAFAFA] hover:bg-gray-100 transition"
          >
            <div className="text-lg font-semibold">View Requests</div>
            <div className="text-sm text-gray-600 mt-1">
              Track progress and statuses
            </div>
          </Link>

          <Link
            href="/customer/vehicles"
            className="block p-4 rounded-xl border bg-[#FAFAFA] hover:bg-gray-100 transition"
          >
            <div className="text-lg font-semibold">Your Vehicles</div>
            <div className="text-sm text-gray-600 mt-1">
              Browse and manage your fleet
            </div>
          </Link>

        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* PROFILE */}
      <TeslaSection title="Account">
        <Link
          href="/customer/profile"
          className="text-blue-600 underline text-sm"
        >
          Manage Profile →
        </Link>
      </TeslaSection>

    </div>
  );
}
