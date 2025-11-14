// app/office/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { InviteUserButton } from "@/components/InviteUserButton";
import { UI_STATUSES, type UiStatus } from "@/lib/status";
import ReadonlyScheduled from "@/components/office/ReadonlyScheduled";
import { useLocationScope } from "@/lib/useLocationScope";

type RequestRow = {
  id: string;
  status: UiStatus | string;
  service?: string | null;
  priority?: string | null;
  fmc?: string | null;
  mileage?: number | null;
  po?: string | null;
  notes?: string | null; // used as "Notes from Tech" when completed via Tech flow
  dispatch_notes?: string | null; // dispatcher / send-back notes
  notes_from_tech?: string | null;
  tech_notes?: string | null;
  created_at?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  customer?: { id: string; name?: string | null } | null;
  vehicle?: {
    id?: string;
    unit_number?: string | null;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
  } | null;
  location?: { id?: string; name?: string | null } | null;
  technician?: { id: string | null; name?: string | null } | null;
};

type RequestDetails = RequestRow & {
  notes_list?: Array<{ id: string; text: string; created_at?: string | null }> | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}
async function patchJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}
async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}
async function delJSON<T>(url: string) {
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s as string;
  }
}

function classifyNote(text: string) {
  const raw = (text || "").trim();
  const lower = raw.toLowerCase();

  if (lower.startsWith("tech:")) {
    return {
      kind: "tech",
      label: "Notes from Tech",
      content: raw.slice("tech:".length).trim() || raw,
    } as const;
  }
  if (lower.startsWith("sent back by tech:")) {
    return {
      kind: "tech-return",
      label: "Sent back by Tech",
      content: raw.slice("sent back by tech:".length).trim() || raw,
    } as const;
  }
  if (lower.startsWith("dispatch reschedule:")) {
    return {
      kind: "dispatch",
      label: "Dispatch",
      content: raw.slice("dispatch reschedule:".length).trim() || raw,
    } as const;
  }
  return { kind: "other", label: null, content: raw } as const;
}

function renderVehicle(v?: RequestRow["vehicle"]) {
  if (!v) return "—";
  const parts: string[] = [];
  if (v.year) parts.push(String(v.year));
  if (v.make) parts.push(v.make);
  if (v.model) parts.push(v.model);
  const main = parts.join(" ").trim();
  if (main && v.unit_number) return `${main} (${v.unit_number})`;
  if (main) return main;
  if (v.unit_number) return v.unit_number;
  if (v.plate) return v.plate;
  if (v.id) return v.id;
  return "—";
}

export default function OfficeQueuePage() {
  // Location scope from header gear shift
  const { locationId: scopedLocationId } = useLocationScope();

  // table
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // drawer
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerRow, setDrawerRow] = useState<RequestDetails | null>(null);
  const [drawerErr, setDrawerErr] = useState("");
  const [drawerBusy, setDrawerBusy] = useState(false);

  // drawer editable fields (NO scheduled_at here)
  const [dStatus, setDStatus] = useState<UiStatus>("NEW");
  const [dService, setDService] = useState<string>("");
  const [dFmc, setDFmc] = useState<string>("");
  const [dPo, setDPo] = useState<string>("");
  const [dMileage, setDMileage] = useState<string>("");

  // notes in drawer (Office-only threaded notes)
  const [notes, setNotes] = useState<
    Array<{ id: string; text: string; created_at?: string | null }>
  >([]);
  const [newNote, setNewNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteErr, setNoteErr] = useState("");

  // FILTER TOGGLES
  const [showNew, setShowNew] = useState(true);
  const [showWaitingSched, setShowWaitingSched] = useState(true);
  const [showWaitingApproval, setShowWaitingApproval] = useState(true);
  const [showDeclined, setShowDeclined] = useState(true);
  const [showWaitingParts, setShowWaitingParts] = useState(true);
  const [showScheduled, setShowScheduled] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showDispatched, setShowDispatched] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  // Office cannot set SCHEDULED or DISPATCHED from here
  const statusOptions = useMemo(
    () => UI_STATUSES.filter((s) => s !== "SCHEDULED" && s !== "DISPATCHED"),
    []
  );

  // Build query fragment when scoped by location
  const queryFragment = useMemo(() => {
    return scopedLocationId ? `&location_id=${encodeURIComponent(scopedLocationId)}` : "";
  }, [scopedLocationId]);

  // load table (scoped by location if chosen)
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const base =
        "/api/requests?status=NEW,SCHEDULED,WAITING_TO_BE_SCHEDULED,IN_PROGRESS" +
        "&limit=200&sortBy=created_at&sortDir=desc";
      const url = `${base}${queryFragment}`;

      try {
        const data = await fetchJSON<{ rows: RequestRow[] }>(url);
        if (!live) return;
        setRows(data.rows || []);
      } catch (e: any) {
        if (!live) return;
        setErr(e?.message || "Failed to load queue");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [queryFragment]);

  // client-side filter (using UI labels)
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const s = String(r.status || "").toUpperCase().replace(/_/g, " ");

      const matchNew = showNew && s === "NEW";
      const matchWaitingSched = showWaitingSched && s === "WAITING TO BE SCHEDULED";
      const matchWaitingApproval = showWaitingApproval && s === "WAITING APPROVAL";
      const matchDeclined = showDeclined && s === "DECLINED";
      const matchWaitingParts = showWaitingParts && s === "WAITING FOR PARTS";
      const matchScheduled = showScheduled && s === "SCHEDULED";
      const matchInProgress = showInProgress && s === "IN PROGRESS";
      const matchDispatched = showDispatched && s === "DISPATCHED";
      const matchCompleted = showCompleted && s === "COMPLETED";

      if (
        !showNew &&
        !showWaitingSched &&
        !showWaitingApproval &&
        !showDeclined &&
        !showWaitingParts &&
        !showScheduled &&
        !showInProgress &&
        !showDispatched &&
        !showCompleted
      ) {
        return true;
      }

      return (
        matchNew ||
        matchWaitingSched ||
        matchWaitingApproval ||
        matchDeclined ||
        matchWaitingParts ||
        matchScheduled ||
        matchInProgress ||
        matchDispatched ||
        matchCompleted
      );
    });
  }, [
    rows,
    showNew,
    showWaitingSched,
    showWaitingApproval,
    showDeclined,
    showWaitingParts,
    showScheduled,
    showInProgress,
    showDispatched,
    showCompleted,
  ]);

  // Drawer helpers
  async function openDrawer(id: string) {
    setShowDrawer(true);
    setDrawerId(id);
    setDrawerErr("");
    setDrawerBusy(true);

    try {
      const detail = await fetchJSON<RequestDetails>(
        `/api/requests/${encodeURIComponent(id)}`
      );
      const fromList = rows.find((r) => r.id === id) || ({} as RequestRow);

      const merged: RequestDetails = {
        id,
        status: (detail.status ?? fromList.status ?? "NEW") as UiStatus,
        service: detail.service ?? fromList.service ?? null,
        fmc: (detail as any).fmc ?? (fromList as any).fmc ?? null,
        po:
          detail.po !== undefined && detail.po !== null
            ? detail.po
            : fromList.po ?? null,
        mileage:
          detail.mileage !== undefined && detail.mileage !== null
            ? detail.mileage
            : fromList.mileage ?? null,
        priority: detail.priority ?? fromList.priority ?? null,
        created_at: detail.created_at ?? fromList.created_at ?? null,
        scheduled_at: detail.scheduled_at ?? fromList.scheduled_at ?? null,
        customer: detail.customer || fromList.customer || null,
        vehicle: detail.vehicle || fromList.vehicle || null,
        location: detail.location || fromList.location || null,
        technician: detail.technician || fromList.technician || null,
        notes: detail.notes ?? fromList.notes ?? null,
        dispatch_notes:
          detail.dispatch_notes ?? fromList.dispatch_notes ?? null,
        notes_list: detail.notes_list ?? fromList.notes_list ?? null,
      };

      setDrawerRow(merged);

      setDStatus(merged.status as UiStatus);
      setDService(merged.service || "");
      setDFmc((merged as any).fmc || "");
      setDPo(
        merged.po !== undefined && merged.po !== null ? String(merged.po) : ""
      );
      setDMileage(
        merged.mileage !== undefined &&
          merged.mileage !== null &&
          merged.mileage !== ("" as any)
          ? String(merged.mileage)
          : ""
      );

      const notesList =
        merged.notes_list?.map((n) => ({
          id: n.id,
          text: n.text,
          created_at: n.created_at ?? null,
        })) ?? [];

      setNotes(notesList);
      setNewNote("");
      setNoteErr("");
    } catch (e: any) {
      setDrawerErr(e.message || "Failed to load details");
    } finally {
      setDrawerBusy(false);
    }
  }

  function closeDrawer() {
    if (drawerBusy || noteBusy) return;
    setShowDrawer(false);
    setDrawerId(null);
    setDrawerRow(null);
    setDrawerErr("");
  }

  async function saveDetails() {
    if (!drawerId) return;
    setDrawerBusy(true);
    setDrawerErr("");
    try {
      const forbidden = new Set(["SCHEDULED", "DISPATCHED"]);
      const safeStatus =
        dStatus &&
        forbidden.has(String(dStatus).toUpperCase() as UiStatus)
          ? undefined
          : dStatus;

      const body: any = {
        status: safeStatus ?? null,
        service: dService || null,
        fmc: dFmc || null,
        po: dPo || null,
        mileage: dMileage ? Number(dMileage) : null,
      };
      delete body.scheduled_at;
      delete (body as any).technician_id;

      const updated = await patchJSON<RequestDetails>(
        `/api/requests/${encodeURIComponent(drawerId)}`,
        body
      );
      setDrawerRow(updated);

      setRows((prev) =>
        prev.map((r) =>
          r.id === drawerId
            ? {
                ...r,
                status: updated.status,
                service: updated.service,
                fmc: updated.fmc,
                po: updated.po,
                mileage: updated.mileage,
                scheduled_at: updated.scheduled_at,
                vehicle: updated.vehicle ?? r.vehicle,
                technician: updated.technician ?? r.technician,
                notes:
                  updated.notes !== undefined ? updated.notes : r.notes,
                dispatch_notes:
                  updated.dispatch_notes !== undefined
                    ? updated.dispatch_notes
                    : r.dispatch_notes,
              }
            : r
        )
      );
    } catch (e: any) {
      setDrawerErr(e.message || "Update failed");
    } finally {
      setDrawerBusy(false);
    }
  }

  async function addNote() {
    if (!drawerId) return;
    const text = newNote.trim();
    if (!text) return;
    setNoteBusy(true);
    setNoteErr("");
    try {
      let noteResp:
        | { id: string; text: string; created_at?: string | null }
        | null = null;

      try {
        noteResp = await postJSON(
          `/api/requests/${encodeURIComponent(drawerId)}/notes`,
          { text }
        );
      } catch {
        const d = await patchJSON<RequestDetails>(
          `/api/requests/${encodeURIComponent(drawerId)}`,
          {
            add_note: text,
          }
        );
        const latest = (d.notes_list || [])[0];
        if (latest)
          noteResp = {
            id: latest.id,
            text: latest.text,
            created_at: latest.created_at ?? null,
          };
      }

      if (noteResp) {
        setNotes((prev) => [noteResp!, ...prev]);
        setNewNote("");
      }
    } catch (e: any) {
      setNoteErr(e.message || "Failed to add note");
    } finally {
      setNoteBusy(false);
    }
  }

  async function removeNote(id: string) {
    if (!drawerId) return;
    setNoteBusy(true);
    setNoteErr("");
    try {
      try {
        await delJSON(
          `/api/requests/${encodeURIComponent(
            drawerId
          )}/notes/${encodeURIComponent(id)}`
        );
      } catch {
        await patchJSON<RequestDetails>(
          `/api/requests/${encodeURIComponent(drawerId)}`,
          {
            remove_note_id: id,
          }
        );
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      setNoteErr(e.message || "Failed to remove note");
    } finally {
      setNoteBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Office Queue</h1>
        <InviteUserButton />
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 mb-2 text-sm">
        {[
          ["NEW", showNew, setShowNew],
          ["WAITING TO BE SCHEDULED", showWaitingSched, setShowWaitingSched],
          ["WAITING APPROVAL", showWaitingApproval, setShowWaitingApproval],
          ["DECLINED", showDeclined, setShowDeclined],
          ["WAITING FOR PARTS", showWaitingParts, setShowWaitingParts],
          ["SCHEDULED", showScheduled, setShowScheduled],
          ["IN PROGRESS", showInProgress, setShowInProgress],
          ["DISPATCHED", showDispatched, setShowDispatched],
          ["COMPLETED", showCompleted, setShowCompleted],
        ].map(([label, val, setter]) => (
          <label key={label as string} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={val as boolean}
              onChange={(e) => (setter as any)(e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {loading ? (
        <div>Loading queue…</div>
      ) : err ? (
        <div className="text-red-600">Error: {err}</div>
      ) : filteredRows.length === 0 ? (
        <div>No service requests found.</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2">Customer</th>
              <th className="text-left px-3 py-2">Vehicle</th>
              <th className="text-left px-3 py-2">Service</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Priority</th>
              <th className="text-left px-3 py-2">Scheduled</th>
              <th className="text-left px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => {
              const dn = (r.dispatch_notes || "").toLowerCase();
              const isTechSendBack = dn.startsWith("tech send-back:");
              return (
                <tr
                  key={r.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => openDrawer(r.id)}
                >
                  <td className="px-3 py-2">{r.customer?.name || "—"}</td>
                  <td className="px-3 py-2">{renderVehicle(r.vehicle)}</td>
                  <td className="px-3 py-2">{r.service || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span>{r.status}</span>
                      {isTechSendBack && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 border border-amber-200">
                          Tech send-back
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.priority || "—"}</td>
                  <td className="px-3 py-2">{fmtDate(r.scheduled_at)}</td>
                  <td className="px-3 py-2">{fmtDate(r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Drawer */}
      {showDrawer ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget && !drawerBusy && !noteBusy)
              closeDrawer();
          }}
        >
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Request Details</h2>
              <button
                onClick={() => !drawerBusy && !noteBusy && closeDrawer()}
                className="px-3 py-1 border rounded"
              >
                ✕
              </button>
            </div>

            {drawerErr ? (
              <div className="border border-red-300 bg-red-50 text-red-800 p-2 rounded mb-3">
                {drawerErr}
              </div>
            ) : null}

            {!drawerRow ? (
              <div>Loading…</div>
            ) : (
              <div className="space-y-6">
                {/* Editable (no scheduling fields) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="block mb-1">Status</span>
                    <select
                      className="border rounded-md px-3 py-2 w-full"
                      value={dStatus}
                      onChange={(e) =>
                        setDStatus(e.target.value as UiStatus)
                      }
                      disabled={drawerBusy}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-500">
                      Office cannot set <strong>SCHEDULED</strong> or{" "}
                      <strong>DISPATCHED</strong>. Use Dispatch.
                    </span>
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">Service</span>
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={dService}
                      onChange={(e) => setDService(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">FMC</span>
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={dFmc}
                      onChange={(e) => setDFmc(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">PO</span>
                    <input
                      className="border rounded-md px-3 py-2 w-full"
                      value={dPo}
                      onChange={(e) => setDPo(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="block mb-1">Mileage</span>
                    <input
                      type="number"
                      className="border rounded-md px-3 py-2 w-full"
                      value={dMileage}
                      onChange={(e) => setDMileage(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>

                  {/* Read-only Scheduled */}
                  <div className="mt-3">
                    <ReadonlyScheduled
                      value={drawerRow?.scheduled_at ?? null}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Readonly context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm">
                    <div className="text-gray-500">Created</div>
                    <div>{fmtDate(drawerRow.created_at)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Customer</div>
                    <div>{drawerRow.customer?.name || "—"}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Location</div>
                    <div>{drawerRow.location?.name || "—"}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Vehicle</div>
                    <div>{renderVehicle(drawerRow.vehicle)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">Technician</div>
                    <div>
                      {drawerRow.technician?.name ||
                        drawerRow.technician?.id ||
                        "—"}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    className="px-4 py-2 border rounded"
                    onClick={closeDrawer}
                    disabled={drawerBusy || noteBusy}
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
                    onClick={saveDetails}
                    disabled={drawerBusy || noteBusy}
                  >
                    {drawerBusy ? "Saving…" : "Save"}
                  </button>
                </div>

                {/* Dispatcher + Tech notes (read-only) */}
                <div className="pt-3 space-y-3">
                  {drawerRow.dispatch_notes && (
                    <div className="text-sm">
                      <div className="font-semibold">Dispatcher Notes</div>
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {drawerRow.dispatch_notes}
                      </div>
                    </div>
                  )}
                  {(drawerRow.notes_from_tech ||
                    drawerRow.tech_notes ||
                    drawerRow.notes) && (
                    <div className="text-sm">
                      <div className="font-semibold">Notes from Tech</div>
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {drawerRow.notes_from_tech ||
                          drawerRow.tech_notes ||
                          drawerRow.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Office internal notes thread */}
                <div className="pt-3">
                  <div className="text-base font-semibold mb-2">
                    Office Notes
                  </div>

                  {noteErr ? (
                    <div className="border border-amber-300 bg-amber-50 text-amber-800 p-2 rounded mb-2 text-sm">
                      {noteErr}
                    </div>
                  ) : null}

                  <div className="flex items-start gap-2 mb-3">
                    <textarea
                      className="border rounded-md px-3 py-2 w-full min-h-[80px]"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note…"
                      disabled={noteBusy}
                    />
                    <button
                      className="px-3 py-2 border rounded bg-black text-white disabled:opacity-40"
                      onClick={addNote}
                      disabled={noteBusy || !newNote.trim()}
                    >
                      {noteBusy ? "Adding…" : "Add"}
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="text-sm text-gray-500">No notes yet.</div>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((n) => {
                        const { label, content } = classifyNote(n.text || "");
                        return (
                          <li key={n.id} className="border rounded-md p-3">
                            {label && (
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                                {label}
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">
                              {content || n.text}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {fmtDate(n.created_at)}
                            </div>
                            <div className="mt-2">
                              <button
                                className="text-xs px-2 py-1 border rounded"
                                onClick={() => removeNote(n.id)}
                                disabled={noteBusy}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
