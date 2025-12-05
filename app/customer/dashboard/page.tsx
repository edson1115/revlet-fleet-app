"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/customer/dashboard", {
        cache: "no-store",
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Dashboard failed");

      setStats(js.stats);
      setRecentRequests(js.recent_requests);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ------------------------------------------------------
  // REALTIME – Refresh dashboard on request changes
  // ------------------------------------------------------
  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel("customer_dashboard_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard…</div>;
  }

  if (err) {
    return <div className="p-6 text-red-600">Error: {err}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-1">
          Customer Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          Overview of your fleet activity, vehicles, and service status.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TeslaServiceCard title="Total Requests">
          <div className="text-3xl font-semibold">{stats.total_requests}</div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Active Requests">
          <div className="text-3xl font-semibold">
            {stats.active_requests}
          </div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Vehicles">
          <div className="text-3xl font-semibold">{stats.vehicles}</div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Completed (30 Days)">
          <div className="text-3xl font-semibold">
            {stats.completed_30days}
          </div>
        </TeslaServiceCard>
      </div>

      <TeslaDivider />

      {/* RECENT REQUESTS */}
      <TeslaSection title="Recent Requests">
        <div className="space-y-3 mt-4">
          {recentRequests.length === 0 && (
            <div className="text-sm text-gray-500">
              No recent service activity.
            </div>
          )}

          {recentRequests.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-4 bg-[#FAFAFA] flex justify-between items-center"
            >
              <div>
                <div className="text-lg font-semibold">
                  {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                </div>
                <div className="text-sm text-gray-500">
                  Service: {r.service || "General Service"}
                </div>
                <div className="text-sm text-gray-500">
                  Status:{" "}
                  <span className="font-medium text-blue-700">
                    {r.status}
                  </span>
                </div>
              </div>

              <Link
                href={`/customer/requests/${r.id}`}
                className="text-blue-600 underline text-sm"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* LINKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeslaServiceCard title="View All Requests">
          <Link
            href="/customer/requests"
            className="block mt-3 text-blue-600 underline text-sm"
          >
            Go to Requests →
          </Link>
        </TeslaServiceCard>

        <TeslaServiceCard title="View Vehicles">
          <Link
            href="/customer/vehicles"
            className="block mt-3 text-blue-600 underline text-sm"
          >
            Go to Vehicles →
          </Link>
        </TeslaServiceCard>
      </div>
    </div>
  );
}
