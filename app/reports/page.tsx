"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";

type Me = {
  id: string;
  role: string;
};

type TechnicianInfo = {
  id: string;
  name?: string | null;
  full_name?: string | null;
};

type RequestRow = {
  id: string;
  status: string;
  created_at?: string | null;
  completed_at?: string | null;
  dispatch_notes?: string | null;
  technician?: TechnicianInfo | null;
};

type Summary = {
  total_open: number;
  waiting: number;
  scheduled: number;
  needs_reschedule: number;
  in_progress: number;
  completed_in_range: number;
  tech_sendbacks_in_range: number;
};

type TechStats = {
  techId: string;
  name: string;
  completed_30d: number;
  in_progress: number;
};

type Range = 7 | 30 | 60;

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

export default function ReportsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [range, setRange] = useState<Range>(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [techStats, setTechStats] = useState<TechStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // ---- 1) Check access ----
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
        setErr(null);

        // ---- 2) Load requests snapshot ----
        const qs = new URLSearchParams();
        qs.set(
          "status",
          [
            "WAITING_TO_BE_SCHEDULED",
            "SCHEDULED",
            "RESCHEDULE",
            "IN_PROGRESS",
            "COMPLETED",
          ].join(",")
        );
        // ask for plenty; backend can cap if needed
        qs.set("limit", "20000");

        const out = await getJSON<{ rows?: RequestRow[] }>(
          `/api/requests?${qs.toString()}`
        );
        const rows = out.rows || [];

        // ---- 3) Summaries for selected range ----
        const now = new Date();
        const from = new Date(
          now.getTime() - range * 24 * 60 * 60 * 1000
        );

        let waiting = 0;
        let scheduled = 0;
        let needs_reschedule = 0;
        let in_progress = 0;
        let completed_in_range = 0;
        let tech_sendbacks_in_range = 0;

        for (const r of rows) {
          const ns = normStatus(r.status);
          const dn = (r.dispatch_notes || "").toLowerCase();
          const isTSB = dn.startsWith("tech send-back:");
          const createdAt = r.created_at
            ? new Date(r.created_at)
            : null;
          const completedAt = r.completed_at
            ? new Date(r.completed_at)
            : null;

          if (ns === "WAITING TO BE SCHEDULED") waiting++;
          else if (ns === "SCHEDULED") scheduled++;
          else if (ns === "RESCHEDULE") needs_reschedule++;
          else if (ns === "IN PROGRESS") in_progress++;

          if (
            ns === "COMPLETED" &&
            completedAt &&
            completedAt >= from
          ) {
            completed_in_range++;
          }

          if (isTSB && createdAt && createdAt >= from) {
            tech_sendbacks_in_range++;
          }
        }

        setSummary({
          total_open:
            waiting +
            scheduled +
            needs_reschedule +
            in_progress,
          waiting,
          scheduled,
          needs_reschedule,
          in_progress,
          completed_in_range,
          tech_sendbacks_in_range,
        });

        // ---- 4) Tech metrics block (last 30d) ----
        const map = new Map<string, TechStats>();
        const from30 = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

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
              completed_30d: 0,
              in_progress: 0,
            };
            map.set(techId, ts);
          }

          if (
            ns === "COMPLETED" &&
            completedAt &&
            completedAt >= from30
          ) {
            ts.completed_30d++;
          }

          if (ns === "IN PROGRESS") {
            ts.in_progress++;
          }
        }

        const techList = Array.from(map.values()).sort(
          (a, b) => b.completed_30d - a.completed_30d
        );
        setTechStats(techList);
      } catch (e: any) {
        setErr(e?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  if (authorized === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-gray-600">
          Reports are only available to admin, office, dispatch, or superadmin users.
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-gray-600">
            Operational snapshot + technician performance. Completed jobs older than 60 days are automatically removed.
          </p>
        </div>
        <RangeSelector range={range} onChange={setRange} />
      </div>

      {/* Errors / loading */}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}
      {loading && (
        <div className="text-sm text-gray-500">Loading…</div>
      )}

      {/* Summary cards */}
      {summary && !loading && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Open jobs" value={summary.total_open} />
            <StatCard label="Waiting" value={summary.waiting} />
            <StatCard label="Scheduled" value={summary.scheduled} />
            <StatCard
              label="Needs reschedule"
              value={summary.needs_reschedule}
            />
            <StatCard
              label="In progress"
              value={summary.in_progress}
            />
            <StatCard
              label={`Completed (last ${range}d)`}
              value={summary.completed_in_range}
            />
            <StatCard
              label={`Tech send-backs (last ${range}d)`}
              value={summary.tech_sendbacks_in_range}
            />
          </div>

          {/* Open jobs by stage */}
          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Open jobs by stage
            </h2>
            <BarRow
              items={[
                { label: "Waiting", value: summary.waiting },
                { label: "Scheduled", value: summary.scheduled },
                { label: "Needs RS", value: summary.needs_reschedule },
                { label: "In Prog", value: summary.in_progress },
              ]}
            />
          </div>
        </>
      )}

      {/* Tech performance block */}
      {!loading && authorized && (
        <section className="mt-8 space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Technician performance (last 30 days)
          </h2>
          <p className="text-[11px] text-gray-500">
            Internal view only. Shows how many jobs each technician has completed in the last 30 days and how many are currently in progress.
          </p>

          {techStats.length === 0 ? (
            <div className="text-sm text-gray-500">
              No technician activity found in the last 30 days.
            </div>
          ) : (
            <div className="space-y-2">
              {techStats.map((t) => (
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
                        {t.completed_30d}
                      </span>{" "}
                      completed (30d)
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
        </section>
      )}
    </div>
  );
}

function RangeSelector({
  range,
  onChange,
}: {
  range: Range;
  onChange: (v: Range) => void;
}) {
  const opts: Range[] = [7, 30, 60];
  return (
    <div className="flex gap-1 rounded-full border px-1 py-1 bg-white shadow-sm text-xs">
      {opts.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={
            "px-3 py-1 rounded-full " +
            (range === d
              ? "bg-black text-white"
              : "text-gray-700 hover:bg-gray-100")
          }
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border px-4 py-3 shadow-sm bg-white flex flex-col gap-1">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}

function BarRow({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex gap-2 items-end">
      {items.map((i) => (
        <div key={i.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg bg-gray-900/80"
            style={{
              height: `${(i.value / max) * 80}px`,
              minHeight: i.value > 0 ? "6px" : "0px",
            }}
          />
          <div className="text-[10px] text-gray-600 text-center">
            {i.label} ({i.value})
          </div>
        </div>
      ))}
    </div>
  );
}
