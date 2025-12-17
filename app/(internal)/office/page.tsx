"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import TeslaSection from "@/components/tesla/TeslaSection"; // ✅ FIXED

export default function OfficeDashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/office/dashboard", {
          cache: "no-store",
          credentials: "include",
        });
        const js = await res.json();
        if (js.ok) setStats(js.stats);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="Office Dashboard"
        subtitle="Overview of service & tire requests"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* KPI CARDS */}
        <TeslaSection label="Request Overview">
          {loading && (
            <div className="text-gray-500">Loading dashboard…</div>
          )}

          {!loading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <KPI label="Total Requests" value={stats.total} />
              <KPI label="New" value={stats.new} />
              <KPI label="Waiting" value={stats.waiting} />
              <KPI label="Scheduled" value={stats.scheduled} />
              <KPI label="In Progress" value={stats.in_progress} />
              <KPI label="Completed" value={stats.completed} />
            </div>
          )}
        </TeslaSection>

        {/* QUICK LINKS */}
        <TeslaSection label="Actions">
          <Link
            href="/office/requests"
            className="inline-flex items-center rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-900 transition"
          >
            View All Requests
          </Link>
        </TeslaSection>
      </div>
    </TeslaLayoutShell>
  );
}

/* -------------------------------------------
   KPI Card
------------------------------------------- */
function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">
        {value}
      </div>
    </div>
  );
}
