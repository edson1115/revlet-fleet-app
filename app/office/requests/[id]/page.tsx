"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import NotesBox from "@/components/NotesBox";
import { useRequestPhotos } from "@/hooks/useRequestPhotos";

// TESLA LIGHT COMPONENTS
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaKV } from "@/components/tesla/TeslaKV";

let TimelineComp: any = null;
try {
  TimelineComp =
    require("@/components/tesla/TeslaRequestTimeline").TeslaRequestTimeline;
} catch {}

type UUID = string;
type Status =
  | "NEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "WAITING_APPROVAL"
  | "WAITING_PARTS"
  | "DECLINED";

type Vehicle = {
  year: number | null;
  make: string | null;
  model: string | null;
  unit_number?: string | null;
  plate?: string | null;
};

type RequestRow = {
  id: UUID;
  status: Status;
  service: string | null;
  fmc: string | null;
  mileage: number | null;
  po?: string | null;
  po_number?: string | null;
  notes: string | null;
  scheduled_at: string | null;
  preferred_window_start: string | null;
  preferred_window_end: string | null;
  priority: string | null;
  updated_at?: string | null;
  location?: { name: string | null } | null;
  customer?: { name: string | null } | null;
  vehicle?: Vehicle | null;
  technician?: { id?: string; full_name?: string | null } | null;
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
  const router = useRouter();

  const [row, setRow] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // editable fields
  const [fmc, setFmc] = useState("");
  const [mileage, setMileage] = useState<string>("");
  const [po, setPo] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("NORMAL");
  const [pws, setPws] = useState<string>("");
  const [pwe, setPwe] = useState<string>("");

  const [saving, setSaving] = useState(false);

  // scheduling modal
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedAt, setSchedAt] = useState<string>("");
  const [techs, setTechs] = useState<Tech[]>([]);
  const [techId, setTechId] = useState<UUID | "">("");

  const canStart = useMemo(
    () => row && (row.status === "NEW" || row.status === "SCHEDULED"),
    [row]
  );
  const canComplete = useMemo(() => row && row.status === "IN_PROGRESS", [row]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        credentials: "include",
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load");

      const r: RequestRow = js.request;
      setRow(r);
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
        r.preferred_window_end ? r.preferred_window_end.slice(0, 16) : ""
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const onSave = async () => {
    if (!row) return;
    setSaving(true);
    setErr(null);
    try {
      const body: any = {
        fmc: fmc || null,
        po,
        notes: notes || null,
        priority: priority || null,
        mileage: mileage ? Number(mileage) : null,
        preferred_window_start: pws ? new Date(pws).toISOString() : null,
        preferred_window_end: pwe ? new Date(pwe).toISOString() : null,
        expected_updated_at: row.updated_at ?? null,
      };

      const res = await fetch(`/api/requests/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to save");

      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openSchedule = async () => {
    if (!row) return;

    const now = new Date();
    const isoLocal = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    setSchedAt(row.scheduled_at ? row.scheduled_at.slice(0, 16) : isoLocal);

    try {
      const res = await fetch(`/api/lookups?scope=technicians&active=1`, {
        credentials: "include",
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js?.error || "Failed to load technicians");

      const list: Tech[] = (js.data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
      }));
      setTechs(list);

      setTechId((row.technician?.id as UUID) || "");
    } catch {
      setTechs([]);
      setTechId((row.technician?.id as UUID) || "");
    }

    setSchedOpen(true);
  };

  const onSchedule = async () => {
    if (!row) return;

    setSchedOpen(false);
    setErr(null);

    await fetch(`/api/requests/${row.id}/schedule`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduled_at: schedAt ? new Date(schedAt).toISOString() : null,
        technician_id: techId || null,
      }),
    });

    await load();
  };

  if (loading)
    return (
      <div className="p-6 text-center text-gray-600">
        Loading…
      </div>
    );

  if (!row)
    return (
      <div className="p-6 text-red-600">{err || "Not found."}</div>
    );

  return (
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
    { label: "Vehicle", value: row.vehicle ? `${row.vehicle.year ?? ""} ${row.vehicle.make ?? ""} ${row.vehicle.model ?? ""}` : "—" },
    { label: "Created", value: row.created_at ? new Date(row.created_at).toLocaleString() : "—" }
  ]}
/>


      {/* SUMMARY */}
      <TeslaServiceCard title="Request Summary" badge={row.status}>
        <TeslaSection label="Customer">
          <TeslaKV k="Name" v={row.customer?.name ?? "—"} />
        </TeslaSection>

        <TeslaSection label="Location">
          <TeslaKV k="Shop" v={row.location?.name ?? "—"} />
        </TeslaSection>

        <TeslaSection label="Vehicle">
          <TeslaKV k="Unit" v={vehicleLabel(row.vehicle)} />
        </TeslaSection>

        <TeslaSection label="Technician">
          <TeslaKV k="Assigned" v={row.technician?.full_name ?? "—"} />
        </TeslaSection>
      </TeslaServiceCard>

      {/* EDIT DETAILS */}
      <TeslaServiceCard title="Edit Request Details">
        <TeslaSection label="Service">
          {row.service ?? "—"}
        </TeslaSection>

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
            className="px-4 py-2 rounded-lg bg-black text-white"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          <button
            className="px-4 py-2 rounded-lg border"
            onClick={openSchedule}
          >
            Schedule…
          </button>

          {canStart && (
            <button className="px-4 py-2 rounded-lg border">
              Start
            </button>
          )}
          {canComplete && (
            <button className="px-4 py-2 rounded-lg border">
              Complete
            </button>
          )}
        </div>
      </TeslaServiceCard>

      {/* TIMELINE */}
      <TeslaServiceCard title="Timeline">
        {TimelineComp ? (
          <TimelineComp
            scheduled={row.scheduled_at}
            preferredStart={pws}
            preferredEnd={pwe}
          />
        ) : (
          <TeslaSection label="Events">
            <ul className="space-y-1 text-sm">
              <li>
                <span className="text-gray-500">Scheduled:</span>{" "}
                {row.scheduled_at
                  ? new Date(row.scheduled_at).toLocaleString()
                  : "—"}
              </li>

              <li>
                <span className="text-gray-500">Preferred Window:</span>{" "}
                {pws ? new Date(pws).toLocaleString() : "—"} →{" "}
                {pwe ? new Date(pwe).toLocaleString() : "—"}
              </li>
            </ul>
          </TeslaSection>
        )}
      </TeslaServiceCard>

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
            <h3 className="text-lg font-semibold mb-4">
              Set Schedule
            </h3>

            <div className="space-y-4">
              <TeslaSection label="Date & Time">
                <input
                  type="datetime-local"
                  className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                  value={schedAt}
                  onChange={(e) => setSchedAt(e.target.value)}
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
  );
}
