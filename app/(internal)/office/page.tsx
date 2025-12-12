"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export default function OfficeDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total: 0,
    waiting: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
  });

  async function load() {
    try {
      const r = await fetch("/api/requests/stats?scope=internal", {
        cache: "no-store",
      }).then((res) => res.json());

      setStats(r.stats || {});
    } catch (e) {
      console.error("Failed to load Office dashboard stats", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard…</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-semibold">Office Dashboard</h1>

      {/* KPIs */}
      <TeslaSection label="Today's Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total" value={stats.total} />
          <KpiCard label="Waiting" value={stats.waiting}>
            <TeslaStatusChip status="WAITING" />
          </KpiCard>
          <KpiCard label="Scheduled" value={stats.scheduled}>
            <TeslaStatusChip status="SCHEDULED" />
          </KpiCard>
          <KpiCard label="In Progress" value={stats.in_progress}>
            <TeslaStatusChip status="IN_PROGRESS" />
          </KpiCard>
          <KpiCard label="Completed" value={stats.completed}>
            <TeslaStatusChip status="COMPLETED" />
          </KpiCard>
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* Navigation */}
      <TeslaSection label="Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Link
            href="/office/requests"
            className="block p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-medium">View All Requests</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review, assign, update status, and add internal notes.
            </p>
          </Link>

          <Link
            href="/dispatch/queue"
            className="block p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-medium">Dispatch Scheduling</h2>
            <p className="text-sm text-gray-500 mt-1">
              Assign technicians and set appointment windows.
            </p>
          </Link>

          <Link
            href="/tech"
            className="block p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-medium">Tech View</h2>
            <p className="text-sm text-gray-500 mt-1">
              View technician workflow for testing or training.
            </p>
          </Link>

          <Link
            href="/office/customers"
            className="block p-5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-medium">Customer Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add customers, edit accounts, and manage linked users.
            </p>
          </Link>
        </div>
      </TeslaSection>
    </div>
  );
}

/* --------------------------------------------
   KPI CARD COMPONENT
--------------------------------------------- */
function KpiCard({ label, value, children }: any) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
