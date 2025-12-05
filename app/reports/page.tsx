// app/reports/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  role?: string | null;
};

function normalizeRole(role?: string | null) {
  if (!role) return "VIEWER";
  return String(role).trim().toUpperCase();
}

export default function ReportsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("me_failed");
        const js = await res.json();
        if (!live) return;
        setMe({ role: js?.role ?? null });
      } catch {
        if (!live) return;
        setMe(null);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const role = normalizeRole(me?.role);
  const isInternal = ["SUPERADMIN", "ADMIN", "OFFICE", "DISPATCH"].includes(
    role
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600">
        Loading reports…
      </div>
    );
  }

  if (!isInternal) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Reports are available to internal operations roles only
          (Office, Dispatch, Admin, Superadmin).
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-gray-600">
          Internal Ops dashboards for monitoring completion, in-progress work,
          technician performance, customer SLAs, and location metrics.
        </p>
      </header>

      {/* Operational views */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Daily operations
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Completed */}
          <ReportCard
            href="/reports/completed"
            title="Completed jobs"
            badge="Per location"
            description="See all completed service requests by date range, location, and customer. Export or audit what has been done."
          />

          {/* In Progress */}
          <ReportCard
            href="/reports/in-progress"
            title="In-progress & outstanding"
            badge="Live queue"
            description="Monitor active and overdue requests that are still in progress or waiting, broken out by location and technician."
          />
        </div>
      </section>

      {/* Performance views */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Performance & SLAs
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ReportCard
            href="/reports/tech-kpi"
            title="Technician KPIs"
            badge="Per location"
            description="Jobs per tech, completion time, photo compliance, and send-back rates for each technician."
          />
          <ReportCard
            href="/reports/customer-sla"
            title="Customer SLA"
            badge="By fleet customer"
            description="Track on-time completion and turnaround vs SLA targets by customer or fleet management company."
          />
          <ReportCard
            href="/reports/location-metrics"
            title="Location metrics"
            badge="Per market"
            description="Volume, completion rates, and revenue indicators per location (Bay Area, San Antonio, etc.)."
          />
        </div>
      </section>

      {/* Customer dashboard note */}
      <section className="mt-4 border-t pt-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Customer portal dashboards
        </h2>
        <p className="text-sm text-gray-600">
          A mirrored dashboard will live inside the customer portal (for
          Amazon DSPs, Enterprise, etc.) so they see{" "}
          <strong>their own</strong> completed work, SLAs, and upcoming PMs.
          We&apos;ll wire that under the customer/FM side
          (e.g. <code>/fm/dashboard</code>) as the next step.
        </p>
      </section>
    </div>
  );
}

function ReportCard(props: {
  href: string;
  title: string;
  badge?: string;
  description: string;
}) {
  const { href, title, badge, description } = props;
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge && (
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-600 bg-gray-50">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-600 flex-1">{description}</p>
      <span className="mt-2 text-xs text-gray-700 group-hover:underline">
        Open report →
      </span>
    </Link>
  );
}



