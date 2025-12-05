"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabaseBrowser } from "@/lib/supabase/client";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function TechDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  // ---------------------------------------------------
  // LOAD TECH DASHBOARD DATA
  // ---------------------------------------------------
  const load = async () => {
    try {
      const res = await fetch("/api/tech/dashboard", {
        cache: "no-store",
      });
      const js = await res.json();

      if (!res.ok) throw new Error(js.error || "Failed to load");

      setStats(js.stats);
      setJobs(js.jobs);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ---------------------------------------------------
  // REALTIME: Watch Service Request Updates
  // ---------------------------------------------------
  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel("tech_dashboard_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ---------------------------------------------------
  // UI LOADING STATES
  // ---------------------------------------------------
  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard…</div>;
  }

  if (err) {
    return (
      <div className="p-6 text-red-600">
        Could not load dashboard: {err}
      </div>
    );
  }

  const { total_today, in_progress, completed_today } = stats;

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-1">
          Technician Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          Your jobs for today — live updates enabled
        </p>
      </div>

      {/* ---------------- CARDS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <TeslaServiceCard title="Today's Jobs">
          <div className="text-3xl font-semibold">{total_today}</div>
        </TeslaServiceCard>

        <TeslaServiceCard title="In Progress">
          <div className="text-3xl font-semibold text-blue-600">
            {in_progress}
          </div>
        </TeslaServiceCard>

        <TeslaServiceCard title="Completed Today">
          <div className="text-3xl font-semibold text-green-600">
            {completed_today}
          </div>
        </TeslaServiceCard>
      </div>

      <TeslaDivider />

      {/* ---------------- JOBS LIST ---------------- */}
      <TeslaSection title="Assigned Jobs">
        {jobs.length === 0 ? (
          <div className="text-sm text-gray-500 mt-3">
            No jobs assigned.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/tech/requests/${job.id}`}
                className="block border p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="text-lg font-semibold">
                  {job.vehicle?.year} {job.vehicle?.make}{" "}
                  {job.vehicle?.model}
                </div>

                <div className="text-gray-500 text-sm">
                  Unit {job.vehicle?.unit_number} — Plate {job.vehicle?.plate}
                </div>

                <div className="mt-2 text-sm text-gray-700">
                  Service: <b>{job.service || "General Service"}</b>
                </div>

                <div className="text-sm text-gray-600">
                  Customer: {job.customer?.name}
                </div>

                <div className="mt-2 text-sm">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      job.status === "IN_PROGRESS"
                        ? "text-blue-600"
                        : job.status === "SCHEDULED"
                        ? "text-orange-600"
                        : "text-gray-600"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </TeslaSection>
    </div>
  );
}
