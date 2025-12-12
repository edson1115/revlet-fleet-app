"use client";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChartPie,
  Clock,
  Wrench,
  CalendarCheck2,
  AlertTriangle,
} from "lucide-react";

export default function OfficeDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/office/dashboard", { cache: "no-store" });
    const js = await res.json();
    setStats(js);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaLayoutShell>
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
        Office Dashboard
      </h1>

      <p className="text-gray-600 mt-1 mb-8">
        Monitor operations, service requests, and team performance.
      </p>

      {!stats && (
        <div className="text-gray-500 text-sm">Loading dashboard…</div>
      )}

      {stats && (
        <div className="space-y-10">

          {/* ------------------------------ */}
          {/* HIGH LEVEL METRICS */}
          {/* ------------------------------ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <DashboardCard
              icon={<Wrench className="w-5 h-5 text-black" />}
              label="Open Requests"
              value={stats.open_requests}
            />

            <DashboardCard
              icon={<Clock className="w-5 h-5 text-black" />}
              label="Waiting for Approval"
              value={stats.waiting_approval}
            />

            <DashboardCard
              icon={<CalendarCheck2 className="w-5 h-5 text-black" />}
              label="Scheduled Today"
              value={stats.scheduled_today}
            />

            <DashboardCard
              icon={<AlertTriangle className="w-5 h-5 text-black" />}
              label="Urgent"
              value={stats.urgent}
            />
          </div>

          {/* ------------------------------ */}
          {/* TODAY’S SCHEDULE */}
          {/* ------------------------------ */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Today’s Schedule
            </h2>

            <div className="bg-white border rounded-2xl p-6 divide-y">
              {stats.today.length === 0 && (
                <p className="text-gray-500 text-sm">No jobs scheduled today.</p>
              )}

              {stats.today.map((job: any) => (
                <Link
                  href={`/office/requests/${job.id}`}
                  key={job.id}
                  className="block py-4 hover:bg-gray-50 px-2 rounded-lg transition"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {job.vehicle?.year} {job.vehicle?.make}{" "}
                        {job.vehicle?.model}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {job.service || "No description"}
                      </div>
                    </div>

                    <div className="text-right text-sm text-gray-600">
                      {job.scheduled_start_at
                        ? new Date(job.scheduled_start_at).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "—"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ------------------------------ */}
          {/* QUICK ACTIONS */}
          {/* ------------------------------ */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              <QuickActionCard
                title="View Office Queue"
                desc="Review new and waiting requests."
                href="/office/queue"
              />

              <QuickActionCard
                title="View All Requests"
                desc="Filter, search, and manage the entire pipeline."
                href="/office/requests"
              />

              <QuickActionCard
                title="Schedule Jobs"
                desc="Assign techs and set time windows."
                href="/dispatch/scheduled"
              />
            </div>
          </div>
        </div>
      )}
    </TeslaLayoutShell>
  );
}

/* ============================================================
   DASHBOARD CARD COMPONENT
============================================================ */
function DashboardCard({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="p-6 bg-white border rounded-2xl shadow-sm hover:shadow transition">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-xl">{icon}</div>
        <div>
          <div className="text-2xl font-semibold text-gray-900">{value}</div>
          <div className="text-gray-600 text-sm">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   QUICK ACTION CARD
============================================================ */
function QuickActionCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white border rounded-2xl shadow-sm hover:shadow transition"
    >
      <div className="text-lg font-semibold text-gray-900">{title}</div>
      <div className="text-gray-600 text-sm mt-2">{desc}</div>
    </Link>
  );
}
