"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";

/** ------------------------------
 * Helpers
 * ------------------------------ */
function formatTitle(t: string) {
  if (!t) return "Service Request";
  return t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function titleForRequest(r: any) {
  // Canonical priority: Office overrides → internal fallback → system fallback
  return r?.service_title || r?.service || r?.type || "";
}

function safeVehicleLabel(v: any) {
  if (!v) return "Vehicle —";
  const year = v.year ? String(v.year) : "";
  const make = v.make ? String(v.make) : "";
  const model = v.model ? String(v.model) : "";
  const composed = [year, make, model].filter(Boolean).join(" ").trim();
  return composed || "Vehicle —";
}

function safeVehicleId(v: any) {
  if (!v) return "NO ID";
  if (v.unit_number) return `Unit ${v.unit_number}`;
  if (v.plate) return v.plate;
  return "NO ID";
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "UNKNOWN").toUpperCase();

  // Tesla-ish neutral palette (no external dependency)
  const cls =
    s === "NEW"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : s === "WAITING"
      ? "bg-amber-50 text-amber-800 border-amber-100"
      : s === "READY_TO_SCHEDULE"
      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
      : s === "SCHEDULED"
      ? "bg-slate-50 text-slate-700 border-slate-200"
      : s === "IN_PROGRESS"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : s === "COMPLETED"
      ? "bg-gray-50 text-gray-700 border-gray-200"
      : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${cls}`}
    >
      {s}
    </span>
  );
}

export default function OfficeRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Primary endpoint (your UI is using this)
        const res = await fetch("/api/office/requests", {
          cache: "no-store",
          signal: ac.signal,
        });

        const js = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(js?.error || `Failed to load requests (${res.status})`);
        }

        // Support multiple response shapes:
        // - { ok: true, requests: [...] }
        // - { ok: true, rows: [...] }  (queue-style)
        // - { requests: [...] } or { rows: [...] }
        const list = js?.requests ?? js?.rows ?? [];

        if (!Array.isArray(list)) {
          throw new Error("API returned invalid data shape (expected array).");
        }

        setRequests(list);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("OfficeRequestsClient load error:", e);
        setError(e?.message || "Unable to load requests.");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, []);

  // Split into "Action Required" vs "Pipeline"
  const { inbox, pipeline } = useMemo(() => {
    const inbox: any[] = [];
    const pipeline: any[] = [];

    for (const r of requests) {
      const status = (r?.status || "").toUpperCase();
      if (status === "NEW" || status === "WAITING") inbox.push(r);
      else pipeline.push(r);
    }

    return { inbox, pipeline };
  }, [requests]);

  const RequestRow = ({ r }: { r: any }) => {
    const status = (r?.status || "UNKNOWN").toUpperCase();
    const customerName = r?.customer?.name || "Unknown Customer";
    const v = r?.vehicle;

    const dotClass =
      status === "NEW"
        ? "bg-blue-600 animate-pulse"
        : status === "WAITING"
        ? "bg-amber-500"
        : "bg-gray-300";

    return (
      <div
        onClick={() => router.push(`/office/requests/${r.id}`)}
        className="group flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition border-l-4 border-transparent hover:border-black"
      >
        <div className="flex items-center gap-5">
          {/* Status Indicator Dot */}
          <div className={`w-3 h-3 rounded-full shadow-sm ${dotClass}`} />

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-bold text-gray-900 text-lg">
                {formatTitle(titleForRequest(r))}
              </h4>

              {r?.created_by_role === "CUSTOMER" && (
                <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Portal
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{customerName}</span>
              <span className="text-gray-300">|</span>
              <span>{safeVehicleLabel(v)}</span>
              <span className="text-gray-300">•</span>
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600 border border-gray-200">
                {safeVehicleId(v)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-medium uppercase mb-1">
              Status
            </p>
            <StatusBadge status={status} />
          </div>
          <span className="text-gray-300 group-hover:text-black transition text-2xl">
            ›
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Incoming Requests
          </h1>
          <p className="text-gray-500 mt-1">Manage and dispatch new service jobs.</p>
        </div>

        <button
          onClick={() => router.push("/office/requests/new")}
          className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
        >
          <span>+</span> Create Request
        </button>
      </div>

      <button
  onClick={() => router.push("/office")}
  className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wide"
>
  ← Back to Queue
</button>


      {/* Loading */}
      {loading && (
        <div className="p-12 text-center text-gray-400">Loading requests...</div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <p className="font-bold text-red-700">Couldn’t load requests</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800"
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: INBOX */}
      {!loading && !error && (
        <TeslaSection label={`⚠️ Action Required (${inbox.length})`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {inbox.length === 0 ? (
              <div className="p-10 text-center bg-gray-50">
                <p className="text-gray-500 font-medium">No new requests pending.</p>
                <p className="text-sm text-gray-400">Great job! You&apos;re all caught up.</p>
              </div>
            ) : (
              inbox.map((r) => <RequestRow key={r.id} r={r} />)
            )}
          </div>
        </TeslaSection>
      )}

      {/* SECTION 2: PIPELINE */}
      {!loading && !error && pipeline.length > 0 && (
        <TeslaSection label={`🗄️ In Pipeline & History (${pipeline.length})`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden opacity-90">
            {pipeline.map((r) => <RequestRow key={r.id} r={r} />)}
          </div>
        </TeslaSection>
      )}
    </div>
  );
}
