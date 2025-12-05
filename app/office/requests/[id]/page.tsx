"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import NotesBox from "@/components/NotesBox";
import { useRequestPhotos } from "@/lib/hooks/useRequestPhotos";
import PDFButton from "@/components/PDFButton";

import VehicleDrawer from "@/components/vehicles/VehicleDrawer";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

import AiStatusBadge from "@/components/ai/AiStatusBadge";
import AiRefreshButton from "@/components/ai/AiRefreshButton";

let TimelineComp: any = null;
try {
  TimelineComp =
    require("@/components/tesla/TeslaRequestTimeline").TeslaRequestTimeline;
} catch {}

type UUID = string;

type Vehicle = {
  id: UUID;
  year: number | null;
  make: string | null;
  model: string | null;
  unit_number?: string | null;
  plate?: string | null;
};

type RequestRow = {
  id: UUID;
  status: string;
  service: string | null;
  fmc: string | null;
  mileage: number | null;
  po?: string | null;
  po_number?: string | null;
  notes: string | null;
  priority: string | null;

  customer?: { name: string | null } | null;
  location?: { name: string | null } | null;

  vehicle?: Vehicle | null;

  technician?: {
    id: UUID;
    full_name?: string | null;
  } | null;

  created_at: string | null;

  preferred_window_start: string | null;
  preferred_window_end: string | null;

  scheduled_start_at: string | null;
  scheduled_end_at: string | null;

  updated_at?: string | null;

  ai_status?: string | null;
  ai_po_number?: string | null;
};

type Tech = { id: UUID; name: string };

function vehicleLabel(v?: Vehicle | null) {
  if (!v) return "—";
  const base = [v.year, v.make, v.model].filter(Boolean).join(" ");
  const extras = [
    v.unit_number ? `#${v.unit_number}` : null,
    v.plate ? `(${v.plate})` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return [base || "—", extras].filter(Boolean).join(" ");
}

export default function OfficeRequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [row, setRow] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Editable fields
  const [fmc, setFmc] = useState("");
  const [mileage, setMileage] = useState<string>("");
  const [po, setPo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [pws, setPws] = useState<string>("");
  const [pwe, setPwe] = useState<string>("");

  // Scheduling modal
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedStart, setSchedStart] = useState<string>("");
  const [schedEnd, setSchedEnd] = useState<string>("");
  const [techs, setTechs] = useState<Tech[]>([]);
  const [techId, setTechId] = useState<UUID | "">("");

  // Photos hook
  const { photos } = useRequestPhotos(id);

  // Vehicle Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVehicleId, setDrawerVehicleId] = useState<string | null>(null);

  const canStart = useMemo(
    () => row && (row.status === "NEW" || row.status === "SCHEDULED"),
    [row]
  );
  const canComplete = useMemo(() => row && row.status === "IN_PROGRESS", [row]);

  // Load request
  const load = async () => {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/api/requests/${id}`, {
        credentials: "include",
      });
      const js = await res.json();

      if (!res.ok) throw new Error(js?.error || "Failed to load request");

      const r: RequestRow = js.request;

      setRow(r);

      // Fill editable fields
      setFmc(r.fmc ?? "");
      setMileage(r.mileage != null ? String(r.mileage) : "");
      setPo(r.po ?? r.po_number ?? "");
      setNotes(r.notes ?? "");
      setPriority(r.priority ?? "NORMAL");

      setPws(
        r.preferred_window_start
          ? r.preferred_window_start.slice(0, 16)
          : ""
      );

      setPwe(
        r.preferred_window_end
          ? r.preferred_window_end.slice(0, 16)
          : ""
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to load request");
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // SAVE EDITS
  const onSave = async () => {
    if (!row) return;

    setErr(null);

    const body = {
      fmc: fmc || null,
      po,
      notes: notes || null,
      priority: priority || null,
      mileage: mileage ? Number(mileage) : null,
      preferred_window_start: pws ? new Date(pws).toISOString() : null,
      preferred_window_end: pwe ? new Date(pwe).toISOString() : null,
      expected_updated_at: row.updated_at ?? null,
    };

    const resp = await fetch(`/api/requests/${row.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const js = await resp.json();
    if (!resp.ok) {
      setErr(js?.error || "Failed saving changes");
      return;
    }

    await load();
  };

  // OPEN SCHEDULE MODAL
  const openSchedule = async () => {
    if (!row) return;

    const res = await fetch(`/api/lookups?scope=technicians&active=1`, {
      credentials: "include",
    });
    const js = await res.json();

    if (res.ok) {
      setTechs(
        (js.data || []).map((t: any) => ({ id: t.id, name: t.name }))
      );
    } else {
      setTechs([]);
    }

    setTechId((row.technician?.id as UUID) || "");

    // Pre-fill dates
    setSchedStart(
      row.scheduled_start_at
        ? row.scheduled_start_at.slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    );

    setSchedEnd(
      row.scheduled_end_at
        ? row.scheduled_end_at.slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    );

    setSchedOpen(true);
  };

  // APPLY SCHEDULE
  const onSchedule = async () => {
    if (!row) return;

    setSchedOpen(false);

    await fetch(`/api/requests/${row.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reschedule",
        start: schedStart ? new Date(schedStart).toISOString() : null,
        end: schedEnd ? new Date(schedEnd).toISOString() : null,
        technician_id: techId || null,
      }),
    });

    await load();
  };

  // ACTIONS: START / COMPLETE
  const doAction = async (action: string) => {
    if (!row) return;
    await fetch(`/api/requests/${row.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  };

  if (loading)
    return <div className="p-6 text-center text-gray-600">Loading…</div>;

  if (!row)
    return <div className="p-6 text-red-600">{err || "Not found"}</div>;

  return (
    <>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/office/queue"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to Office Queue
          </Link>
        </div>

        <TeslaHeroBar
          title={`Request #${row.id.slice(0, 8)}`}
          status={row.status}
          meta={[
            { label: "Customer", value: row.customer?.name ?? "—" },
            {
              label: "Vehicle",
              value: (
                <span
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => {
                    if (row.vehicle?.id) {
                      setDrawerVehicleId(row.vehicle.id);
                      setDrawerOpen(true);
                    }
                  }}
                >
                  {vehicleLabel(row.vehicle)}
                </span>
              ),
            },
            {
              label: "Created",
              value: row.created_at
                ? new Date(row.created_at).toLocaleString()
                : "—",
            },
          ]}
        />

        {/* SUMMARY */}
        <TeslaServiceCard title="Request Summary" badge={row.status}>
          <TeslaSection label="Customer">
            <TeslaKV k="Name" v={row.customer?.name ?? "—"} />
          </TeslaSection>

          <TeslaSection label="AutoIntegrate">
            <AiStatusBadge status={row.ai_status} po={row.ai_po_number} />
            <div className="mt-2">
              <AiRefreshButton requestId={row.id} />
            </div>
          </TeslaSection>

          <TeslaSection label="Location">
            <TeslaKV k="Shop" v={row.location?.name ?? "—"} />
          </TeslaSection>

          <TeslaSection label="Vehicle">
            <TeslaKV
              k="Unit"
              v={
                <span
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => {
                    if (row.vehicle?.id) {
                      setDrawerVehicleId(row.vehicle.id);
                      setDrawerOpen(true);
                    }
                  }}
                >
                  {vehicleLabel(row.vehicle)}
                </span>
              }
            />
          </TeslaSection>

          <TeslaSection label="Technician">
            <TeslaKV k="Assigned" v={row.technician?.full_name ?? "—"} />
          </TeslaSection>

          {/* PDF */}
          {row.status !== "NEW" && (
            <div className="pt-2">
              <button
                onClick={async () => {
                  const resp = await fetch(
                    `/api/requests/${row.id}/pdf/generate`,
                    { method: "GET", credentials: "include" }
                  );
                  const js = await resp.json();
                  if (!js?.url) return alert("PDF failed");
                  window.open(js.url, "_blank");
                }}
                className="w-full mt-3 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Download PDF
              </button>
            </div>
          )}
        </TeslaServiceCard>

        {/* EDIT DETAILS */}
        <TeslaServiceCard title="Edit Request Details">
          <TeslaSection label="Service">{row.service ?? "—"}</TeslaSection>

          <TeslaSection label="Priority">
            <select
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="NORMAL">NORMAL</option>
              <option value="URGENT">URGENT</option>
            </select>
          </TeslaSection>

          <TeslaSection label="FMC">
            <input
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={fmc}
              onChange={(e) => setFmc(e.target.value)}
            />
          </TeslaSection>

          <TeslaSection label="Mileage">
            <input
              type="number"
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </TeslaSection>

          <TeslaSection label="PO Number">
            <input
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={po}
              onChange={(e) => setPo(e.target.value)}
            />
          </TeslaSection>

          <TeslaSection label="Preferred Window Start">
            <input
              type="datetime-local"
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={pws}
              onChange={(e) => setPws(e.target.value)}
            />
          </TeslaSection>

          <TeslaSection label="Preferred Window End">
            <input
              type="datetime-local"
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={pwe}
              onChange={(e) => setPwe(e.target.value)}
            />
          </TeslaSection>

          <TeslaSection label="Notes">
            <textarea
              rows={4}
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </TeslaSection>

          {/* ACTIONS */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onSave}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm"
            >
              Save Changes
            </button>

            <button
              onClick={openSchedule}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Schedule…
            </button>

            {canStart && (
              <button
                onClick={() => doAction("start_job")}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
              >
                Start
              </button>
            )}

            {canComplete && (
              <button
                onClick={() => doAction("complete_job")}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm"
              >
                Complete
              </button>
            )}

            <PDFButton requestId={row.id} />
          </div>
        </TeslaServiceCard>

        {/* TIMELINE */}
        <TeslaServiceCard title="Timeline">
          {TimelineComp ? (
            <TimelineComp
              scheduledStart={row.scheduled_start_at}
              scheduledEnd={row.scheduled_end_at}
              preferredStart={pws}
              preferredEnd={pwe}
            />
          ) : (
            <TeslaSection label="Events">
              <ul className="space-y-1 text-sm">
                <li>
                  <span className="text-gray-500">Scheduled:</span>{" "}
                  {row.scheduled_start_at
                    ? new Date(row.scheduled_start_at).toLocaleString()
                    : "—"}
                  {" → "}
                  {row.scheduled_end_at
                    ? new Date(row.scheduled_end_at).toLocaleString()
                    : "—"}
                </li>

                <li>
                  <span className="text-gray-500">Preferred Window:</span>{" "}
                  {pws ? new Date(pws).toLocaleString() : "—"} {" → "}
                  {pwe ? new Date(pwe).toLocaleString() : "—"}
                </li>
              </ul>
            </TeslaSection>
          )}
        </TeslaServiceCard>

        {/* PHOTOS */}
        <TeslaServiceCard title="Photos">
          {photos.length === 0 && (
            <div className="text-sm text-gray-500">No photos uploaded.</div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                <img
                  src={p.url}
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                  onClick={() => window.open(p.url, "_blank")}
                />
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                  {p.kind.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </TeslaServiceCard>

        {/* NOTES */}
        <TeslaServiceCard title="Notes">
          <NotesBox requestId={row.id} canAdd />
        </TeslaServiceCard>

        {/* SCHEDULE MODAL */}
        {schedOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Set Schedule</h3>

              <div className="space-y-4">
                <TeslaSection label="Start">
                  <input
                    type="datetime-local"
                    className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                  />
                </TeslaSection>

                <TeslaSection label="End">
                  <input
                    type="datetime-local"
                    className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                  />
                </TeslaSection>

                <TeslaSection label="Technician">
                  <select
                    className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                    value={techId}
                    onChange={(e) => setTechId(e.target.value as UUID)}
                  >
                    <option value="">— Unassigned —</option>
                    {techs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </TeslaSection>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="rounded-lg border px-4 py-2"
                  onClick={() => setSchedOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="rounded-lg bg-black px-4 py-2 text-white"
                  onClick={onSchedule}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {err && (
          <div className="rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-red-700">
            {err}
          </div>
        )}
      </div>

      {/* VEHICLE DRAWER */}
      {drawerVehicleId && (
        <VehicleDrawer
          vehicleId={drawerVehicleId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}
