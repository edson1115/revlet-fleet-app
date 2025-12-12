"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function OutsideSalesDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/outside-sales/stats")
      .then((r) => r.json())
      .then((d) => setStats(d));
  }, []);

  if (!stats) return <div className="p-10">Loading dashboard…</div>;

  return (
    <div className="p-10 space-y-10">
      <TeslaHeroBar 
        title="Outside Sales Dashboard" 
        subtitle="Manage leads, inspections, and converted customers"
      />

      <TeslaSection label="Quick Actions">
        <div className="grid grid-cols-2 gap-4">
          <Link 
            href="/outside-sales/leads/new"
            className="p-4 bg-black text-white rounded-lg text-center"
          >
            ➕ Add New Lead
          </Link>

          <Link 
            href="/outside-sales/leads"
            className="p-4 bg-gray-100 border rounded-lg text-center"
          >
            View Leads
          </Link>
        </div>
      </TeslaSection>

      <TeslaSection label="Your Stats">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-semibold">{stats.total}</div>
            <div className="text-gray-500">Total Leads</div>
          </div>

          <div>
            <div className="text-3xl font-semibold">{stats.converted}</div>
            <div className="text-gray-500">Converted</div>
          </div>

          <div>
            <div className="text-3xl font-semibold">{stats.active}</div>
            <div className="text-gray-500">Active</div>
          </div>
        </div>
      </TeslaSection>
    </div>
  );
}
