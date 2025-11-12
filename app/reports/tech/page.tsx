"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";

type Me = {
  id: string;
  role: string;
};

type Row = {
  id: string;
  status: string;
  technician?: {
    id: string;
    name?: string | null;
    full_name?: string | null;
  } | null;
  completed_at?: string | null;
};

type TechStats = {
  techId: string;
  name: string;
  completed: number;
  in_progress: number;
};

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

function normStatus(s?: string | null): string {
  return String(s || "")
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function TechReportsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<TechStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) Check role
        const me = await getJSON<Me>("/api/me");
        const role = normalizeRole(me.role);

        const allowedRoles = new Set([
          "SUPERADMIN",
          "ADMIN",
          "OFFICE",
          "DISPATCH",
        ]);

        if (!allowedRoles.has(role)) {
          setAuthorized(false);
          return;
        }

        setAuthorized(true);
        setLoading(true);

        // 2) Load relevant requests
        const qs = new URLSearchParams();
        qs.set(
          "status",
          ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].join(",")
        );
        // If your API supports it, you can add a big limit; otherwise backend default is fine.

        const out = await getJSON<{ rows?: Row[] }>(
          `/api/requests?${qs.toString()}`
        );
        const rows = out.rows || [];

        const now = new Date();
        const from = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ); // last 30 days for completed

        const map = new Map<string, TechStats>();

        for (const r of rows) {
          const techId = r.technician?.id;
          if (!techId) continue;

          const name =
            r.technician?.full_name ||
            r.technician?.name ||
            techId;

          const ns = normStatus(r.status);
          const completedAt = r.completed_at
            ? new Date(r.completed_at)
            : null;

          let ts = map.get(techId);
          if (!ts) {
            ts = {
              techId,
              name,
              completed: 0,
              in_progress: 0,
            };
            map.set(techId, ts);
          }

          if (
            ns === "COMPLETED" &&
            completedAt &&
            completedAt >= from
          ) {
            ts.completed++;
          }

          if (ns === "IN PROGRESS") {
            ts.in_progress++;
          }
        }

        const sorted = Array.from(map.values()).sort(
          (a, b) => b.completed - a.completed
        );

        setStats(sorted);
      } catch (e: any) {
        setErr(e?.message || "Failed to load tech metrics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authorized === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">
          Not authorized
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Tech performance reports are only available to admin, office, dispatch, or superadmin users.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-3 text-xs text-gray-500 underline"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Tech Performance (Last 30 days)
        </h1>
        <p className="text-sm text-gray-600">
          Completed jobs and in-progress counts per technician. Completed jobs older than 60 days are removed per retention policy.
        </p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Loading…</div>
      )}

      {!loading && !err && stats.length === 0 && (
        <div className="text-sm text-gray-500">
          No technician activity in the last 30 days.
        </div>
      )}

      {!loading && stats.length > 0 && (
        <div className="space-y-2">
          {stats.map((t) => (
            <div
              key={t.techId}
              className="flex items-center justify-between gap-3 border rounded-2xl px-3 py-2 bg-white shadow-sm text-sm"
            >
              <div className="font-medium">
                {t.name}
              </div>
              <div className="flex gap-4 text-xs text-gray-700">
                <div>
                  <span className="font-semibold">
                    {t.completed}
                  </span>{" "}
                  completed
                </div>
                <div>
                  <span className="font-semibold">
                    {t.in_progress}
                  </span>{" "}
                  in progress
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
