"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CustomerRole =
  | "CUSTOMER"
  | "CUSTOMER_USER"
  | "CUSTOMER_ADMIN"
  | "CLIENT"
  | "FM";

type Me = {
  email?: string | null;
  role?: string | null;
};

type Vehicle = {
  id: string;
  unit_number?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
} | null;

type RequestRow = {
  id: string;
  status: string;
  service?: string | null;
  priority?: string | null;
  fmc?: string | null;
  mileage?: number | null;
  po?: string | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  customer?: { id: string; name?: string | null } | null;
  location?: { id: string; name?: string | null } | null;
  vehicle?: Vehicle;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`
    );
  }
  return (await res.json()) as T;
}

function normalizeRole(role?: string | null) {
  if (!role) return "VIEWER";
  return String(role).trim().toUpperCase();
}

function isCustomerRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  return (
    r === "CLIENT" ||
    r === "FM" ||
    r.startsWith("CUSTOMER")
  );
}

function normStatus(s?: string | null): string {
  return String(s || "")
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fmtDateShort(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s ?? "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s ?? "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderVehicle(v?: Vehicle) {
  if (!v) return "—";
  const parts: string[] = [];
  if (v.unit_number) parts.push(`#${v.unit_number}`);
  if (v.year) parts.push(String(v.year));
  if (v.make) parts.push(v.make);
  if (v.model) parts.push(v.model);
  if (v.plate) parts.push(`(${v.plate})`);
  return parts.join(" ") || "—";
}

export default function CustomerDashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // load /api/me
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const js = await fetchJSON<Me>("/api/me");
        if (!live) return;
        setMe(js);
      } catch {
        if (!live) return;
        setMe(null);
      } finally {
        if (live) setLoadingMe(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // load customer-scoped requests
  useEffect(() => {
    let live = true;
    (async () => {
      setLoadingReqs(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", "500");
        qs.set("sortBy", "created_at");
        qs.set("sortDir", "desc");
        const out = await fetchJSON<{ rows: RequestRow[] }>(
          `/api/requests?${qs.toString()}`
        );
        if (!live) return;
        setRows(out.rows || []);
      } catch (e: any) {
        if (!live) return;
        setError(e?.message || "Failed to load requests");
      } finally {
        if (live) setLoadingReqs(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const role = normalizeRole(me?.role);
  const customerMode = isCustomerRole(me?.role);

  const {
    total,
    openCount,
    completed30,
    byStatus,
    activeVehiclesCount,
    recentRows,
  } = useMemo(() => {
    const now = Date.now();
    const ms30 = 30 * 24 * 60 * 60 * 1000;

    const counts: Record<string, number> = {};
    const vehicleIds = new Set<string>();

    let open = 0;
    let completedLast30 = 0;

    for (const r of rows) {
      const st = normStatus(r.status);
      counts[st] = (counts[st] || 0) + 1;

      if (
        st !== "COMPLETED" &&
        st !== "DECLINED" &&
        st !== "CANCELLED"
      ) {
        open++;
      }

      if (r.completed_at) {
        const t = new Date(r.completed_at).getTime();
        if (!Number.isNaN(t) && now - t <= ms30) {
          completedLast30++;
        }
      }

      if (r.vehicle?.id) vehicleIds.add(r.vehicle.id);
    }

    const recent = [...rows]
      .sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      })
      .slice(0, 8);

    return {
      total: rows.length,
      openCount: open,
      completed30: completedLast30,
      byStatus: counts,
      activeVehiclesCount: vehicleIds.size,
      recentRows: recent,
    };
  }, [rows]);

  if (loadingMe) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div>Loading your account…</div>
      </div>
    );
  }

  if (!customerMode) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
        <h1 className="text-2xl font-semibold">Customer Dashboard</h1>
        <p className="text-sm text-gray-600">
          This view is for fleet / customer accounts. You are logged in as{" "}
          <span className="font-mono">{me?.email || "unknown"}</span> with role{" "}
          <span className="font-mono">{role}</span>.
        </p>
        <p className="text-sm text-gray-500">
          If you think this is incorrect, contact your Revlet admin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Fleet Dashboard</h1>
          <p className="text-sm text-gray-600">
            At-a-glance view of your active jobs, recent activity, and fleet
            health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/fm/requests/new"
            className="rounded-lg border border-black bg-black text-white text-sm px-4 py-2 hover:bg-gray-900"
          >
            + Create Request
          </Link>
          <Link
            href="/fm/requests"
            className="rounded-lg border text-sm px-4 py-2 hover:bg-gray-50"
          >
            View all requests
          </Link>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Open requests</div>
          <div className="mt-1 text-2xl font-semibold">{openCount}</div>
          <div className="mt-2 text-xs text-gray-500">
            Any status except completed / declined / cancelled.
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Completed (last 30 days)</div>
          <div className="mt-1 text-2xl font-semibold">{completed30}</div>
          <div className="mt-2 text-xs text-gray-500">
            Recently finished jobs.
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Active vehicles</div>
          <div className="mt-1 text-2xl font-semibold">
            {activeVehiclesCount}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Vehicles with at least one service request.
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-gray-500">Total requests</div>
          <div className="mt-1 text-2xl font-semibold">{total}</div>
          <div className="mt-2 text-xs text-gray-500">
            All time, scoped to your account.
          </div>
        </div>
      </section>

      {/* Status breakdown */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Requests by status</h2>
        {Object.keys(byStatus).length === 0 ? (
          <p className="text-sm text-gray-500">
            No service requests yet.{" "}
            <Link href="/fm/requests/new" className="underline">
              Create your first one.
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(byStatus).map(([st, count]) => (
              <div
                key={st}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-gray-50"
              >
                <span className="font-medium">{st}</span>
                <span className="text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link
            href="/fm/requests"
            className="text-xs text-gray-600 underline"
          >
            View all
          </Link>
        </div>

        {loadingReqs ? (
          <div className="text-sm text-gray-500">Loading recent jobs…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Error: {error}</div>
        ) : recentRows.length === 0 ? (
          <div className="text-sm text-gray-500">
            No recent activity yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Service</th>
                  <th className="text-left px-3 py-2">Vehicle</th>
                  <th className="text-left px-3 py-2">Location</th>
                  <th className="text-left px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">
                      {fmtDateShort(r.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5">
                        {normStatus(r.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.service || "—"}</td>
                    <td className="px-3 py-2">
                      {renderVehicle(r.vehicle)}
                    </td>
                    <td className="px-3 py-2">
                      {r.location?.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/fm/requests/${encodeURIComponent(r.id)}`}
                        className="text-xs text-gray-700 underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
