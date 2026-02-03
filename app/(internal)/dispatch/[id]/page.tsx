"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import TimelineInteractive from "@/components/dispatch/TimelineInteractive";
import { scheduleRequest } from "@/lib/dispatch/scheduleRequest";

// -----------------------------
// Types
// -----------------------------
type UUID = string;

type RequestRow = {
  id: UUID;
  status: string;
  service: string | null;
  notes: string | null;
  dispatch_notes: string | null;
  technician?: { id: string; name?: string | null } | null;

  scheduled_at?: string | null;
  created_at?: string;

  customer?: { name?: string | null } | null;
  location?: { name?: string | null } | null;

  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
};

type Tech = { id: string; name: string };

// -----------------------------
// Helpers
// -----------------------------
function fmt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString();
}

// Tesla card styling
const card =
  "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3";
const label = "text-xs uppercase text-gray-500 tracking-wide";
const value = "text-sm text-gray-900";
const sectionTitle = "text-lg font-semibold mb-2";

// -----------------------------
// PAGE
// -----------------------------
export default function DispatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [row, setRow] = useState<RequestRow | null>(null);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // -----------------------------
  // Load Request
  // -----------------------------
  async function load() {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const js = await res.json();
      setRow(js.request || null);

      const techRes = await fetch("/api/techs?active=1");
      const techJs = await techRes.json();
      setTechs(techJs.rows || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  // -----------------------------
  // Save Scheduling
  // -----------------------------
  async function handleSave() {
  if (!selectedTech || !timeRange) {
    alert("Pick a technician and a time window");
    return;
  }


  setSaving(true);

  try {
    await scheduleRequest({
      requestId: id,
      technicianId: selectedTech,
      start: timeRange.start,
      end: timeRange.end,
    });

  } catch (e) {
    console.error(e);
    alert("Failed to schedule request");
  } finally {
    setSaving(false);
  }
}


  // -----------------------------
  // RENDER
  // -----------------------------
  if (loading) return <div className="p-6">Loading…</div>;
  if (!row) return <div className="p-6">{err || "Not found"}</div>;

  const v = row.vehicle || {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold mt-2">Dispatch Details</h1>
        <p className="text-sm text-gray-600">
          Schedule and assign technician for this request.
        </p>
      </div>

      {/* SUMMARY CARD */}
      <div className={card}>
        <div className={sectionTitle}>Job Summary</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className={label}>Customer</div>
            <div className={value}>{row.customer?.name || "—"}</div>
          </div>

          <div>
            <div className={label}>Location</div>
            <div className={value}>{row.location?.name || "—"}</div>
          </div>

          <div>
            <div className={label}>Vehicle</div>
            <div className={value}>
              {[
                v.unit_number && `#${v.unit_number}`,
                v.year,
                v.make,
                v.model,
                v.plate && `(${v.plate})`,
              ]
                .filter(Boolean)
                .join(" ")}
            </div>
          </div>

          <div>
            <div className={label}>Service</div>
            <div className={value}>{row.service || "—"}</div>
          </div>

          <div>
            <div className={label}>Status</div>
            <div className="text-sm px-2 py-1 inline-block rounded-full border bg-gray-50">
              {row.status}
            </div>
          </div>

          <div>
            <div className={label}>Created</div>
            <div className={value}>{fmt(row.created_at)}</div>
          </div>
        </div>
      </div>

      {/* TECH SELECT */}
      <div className={card}>
        <div className={sectionTitle}>Assign Technician</div>

        <div className="space-y-2">
          {techs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTech(t.id)}
              className={`w-full text-left p-3 rounded-xl border transition
                ${
                  selectedTech === t.id
                    ? "border-[#80FF44] bg-[#80FF44]/10"
                    : "border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* TIME SELECT */}
      <div className={card}>
        <div className={sectionTitle}>Select Time Window</div>

        <TimelineInteractive onChange={(range) => setTimeRange(range)} />

        {timeRange && (
          <div className="text-sm text-gray-700 mt-2">
            Start: {timeRange.start}
            <br />
            End: {timeRange.end}
          </div>
        )}
      </div>

      {/* FOOTER BUTTON */}
      <button
        onClick={handleSave}
        disabled={!selectedTech || !timeRange || saving}
        className="
          w-full py-3 rounded-xl text-center font-semibold
          bg-[#80FF44] text-black
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-sm hover:bg-[#80FF44]/80 transition
        "
      >
        {saving ? "Saving…" : "Schedule Request"}
      </button>
    </div>
  );
}
