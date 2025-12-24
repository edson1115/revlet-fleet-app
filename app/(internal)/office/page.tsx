"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import TeslaSection from "@/components/tesla/TeslaSection";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type DashboardStats = {
  new: number;
  waiting: number;
  scheduled: number;
  in_progress: number;
  completed: number;
};

export default function OfficeDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/office/dashboard", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Dashboard API failed (${res.status})`);
      }

      const js = await res.json();

      // 🔒 Defensive: ensure stats object exists
      if (!js || !js.stats) {
        throw new Error("Invalid dashboard response");
      }

      setStats(js.stats);
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      setError("Unable to load dashboard");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ---------------- STATES ---------------- */

  if (loading) {
    return <div className="p-8">Loading dashboard…</div>;
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Office Dashboard</h1>
        <p className="text-red-600">
          Dashboard unavailable. Please refresh or re-login.
        </p>
      </div>
    );
  }

  /* ---------------- SAFE RENDER ---------------- */

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <h1 className="text-3xl font-semibold">Office Dashboard</h1>

      {/* KPIs */}
      <TeslaSection label="Today's Overview">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard
            label="New"
            value={stats.new}
            status="NEW"
            onClick={() => router.push("/office/requests?status=NEW")}
          />
          <KpiCard
            label="Waiting"
            value={stats.waiting}
            status="WAITING"
            onClick={() => router.push("/office/requests?status=WAITING")}
          />
          <KpiCard
            label="Scheduled"
            value={stats.scheduled}
            status="SCHEDULED"
            onClick={() => router.push("/office/requests?status=SCHEDULED")}
          />
          <KpiCard
            label="In Progress"
            value={stats.in_progress}
            status="IN_PROGRESS"
            onClick={() => router.push("/office/requests?status=IN_PROGRESS")}
          />
          <KpiCard
            label="Completed"
            value={stats.completed}
            status="COMPLETED"
            onClick={() => router.push("/office/requests?status=COMPLETED")}
          />
        </div>
      </TeslaSection>

      {/* Actions */}
      <TeslaSection label="Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/office/requests"
            className="block p-5 rounded-xl border hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-medium">View All Requests</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review, approve, and manage all service & tire requests
            </p>
          </Link>

          {/* WALK-IN / DROP-OFF */}
          <Link
            href="/office/customers/new-request"
            className="block p-5 rounded-xl border hover:bg-gray-50 transition"
          >
            <h2 className="text-lg font-medium">Customers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create a service request for a customer (walk-in or drop-off)
            </p>
          </Link>
        </div>
      </TeslaSection>
    </div>
  );
}

/* ---------------- KPI CARD ---------------- */

function KpiCard({
  label,
  value,
  status,
  onClick,
}: {
  label: string;
  value: number;
  status: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border bg-white hover:bg-gray-50 text-left transition"
    >
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1">
        <TeslaStatusChip status={status} />
      </div>
    </button>
  );
}
