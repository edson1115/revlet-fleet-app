"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

export default function SalesDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  async function load() {
    try {
      const r = await fetch("/api/outside-sales/dashboard").then((r) => r.json());
      // Check if 'stats' exists in the response before setting it
      if (r && r.stats) {
        setStats(r.stats);
      } else {
         // Fallback to zeros if API fails so page doesn't crash
         setStats({ total_leads: 0, converted: 0, visits: 0, pending_followups: 0, approved: 0, scheduled: 0, completed: 0 });
      }
    } catch (e) {
      console.error(e);
      setStats({ total_leads: 0, converted: 0, visits: 0, pending_followups: 0, approved: 0, scheduled: 0, completed: 0 });
    }
  }

  useEffect(() => { load(); }, []);

  if (!stats) return <div className="p-10">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <TeslaHeroBar
        title="Outside Sales Dashboard"
        status="SALES"
      />

      <TeslaSection label="Sales Funnel">
        <TeslaListRow title="Total Leads" subtitle={String(stats.total_leads || 0)} />
        <TeslaListRow title="Converted Customers" subtitle={String(stats.converted || 0)} />
        <TeslaListRow title="Visits Logged" subtitle={String(stats.visits || 0)} />
        <TeslaListRow title="Pending Follow Ups" subtitle={String(stats.pending_followups || 0)} />
      </TeslaSection>

      <TeslaSection label="Revenue Impact">
        <TeslaListRow title="Approved Requests" subtitle={String(stats.approved || 0)} />
        <TeslaListRow title="Scheduled Jobs" subtitle={String(stats.scheduled || 0)} />
        <TeslaListRow title="Completed Jobs" subtitle={String(stats.completed || 0)} />
      </TeslaSection>
    </div>
  );
}