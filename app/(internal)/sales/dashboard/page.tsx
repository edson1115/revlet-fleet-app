"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

export default function SalesDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  async function load() {
    const r = await fetch("/api/outside-sales/dashboard").then(r => r.json());
    if (r.ok) setStats(r.stats);
  }

  useEffect(() => load(), []);

  if (!stats) return <div className="p-10">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <TeslaHeroBar
        title="Outside Sales Dashboard"
        subtitle="Lead & Customer Conversions"
        status="SALES"
      />

      <TeslaSection label="Sales Funnel">
        <TeslaListRow left="Total Leads" right={stats.total_leads} />
        <TeslaListRow left="Converted Customers" right={stats.converted} />
        <TeslaListRow left="Visits Logged" right={stats.visits} />
        <TeslaListRow left="Pending Follow Ups" right={stats.pending_followups} />
      </TeslaSection>

      <TeslaSection label="Revenue Impact">
        <TeslaListRow left="Approved Requests" right={stats.approved} />
        <TeslaListRow left="Scheduled Jobs" right={stats.scheduled} />
        <TeslaListRow left="Completed Jobs" right={stats.completed} />
      </TeslaSection>
    </div>
  );
}
