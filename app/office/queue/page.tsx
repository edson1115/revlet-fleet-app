"use client";

import { useEffect, useMemo, useState } from "react";
import { InviteUserButton } from "@/components/InviteUserButton";
import { UI_STATUSES, type UiStatus } from "@/lib/status";

type RequestRow = {
  id: string;
  status: UiStatus | string;
  service?: string | null;
  priority?: string | null;
  fmc?: string | null;
  mileage?: number | null;
  po?: string | null;
  notes?: string | null;
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
  const res = await fetch(url, { credentials: "include" });
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

  // drawer editable fields
  const [dStatus, setDStatus] = useState<UiStatus>("NEW");
  const [dService, setDService] = useState<string>("");
  const [dFmc, setDFmc] = useState<string>("");
  const [dPo, setDPo] = useState<string>("");
  const [dMileage, setDMileage] = useState<string>("");
  const [dScheduledAt, setDScheduledAt] = useState<string>("");

  // notes in drawer
  const [notes, setNotes] = useState<Array<{ id: string; text: string; created_at?: string | null }>>([]);
  const [newNote, setNewNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteErr, setNoteErr] = useState("");

  // FILTER TOGGLES (all separate now)
  const [showNew, setShowNew] = useState(true);
  const [showWaitingSched, setShowWaitingSched] = useState(true);
  const [showWaitingApproval, setShowWaitingApproval] = useState(true);
  const [showDeclined, setShowDeclined] = useState(true);
  const [showWaitingParts, setShowWaitingParts] = useState(true);
  const [showScheduled, setShowScheduled] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showDispatched, setShowDispatched] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  // pull from lib so Office + Dispatch + Superadmin all see the same label list
  const statusOptions = useMemo(() => UI_STATUSES, []);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchJSON<{ rows: RequestRow[] }>(
          "/api/requests?limit=50&sortBy=created_at&sortDir=desc"
        );
        if (!mounted) return;
        setRows(data.rows || []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e.message || "Failed to load queue");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // client-side filter
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const s = (r.status || "").toUpperCase();
      const isScheduled = !!r.scheduled_at;

      const matchNew = showNew && s === "NEW";
      const matchWaitingSched = showWaitingSched && s === "WAITING_TO_BE_SCHEDULED";
      const matchWaitingApproval = showWaitingApproval && s === "WAITING_APPROVAL";
      const matchDeclined = showDeclined && s === "DECLINED";
      const matchWaitingParts = showWaitingParts && s === "WAITING_FOR_PARTS";
      // treat real SCHEDULED + "has a scheduled_at" as scheduled
      const matchScheduled = showScheduled && (s === "SCHEDULED" || isScheduled);
      const matchInProgress = showInProgress && s === "IN_PROGRESS";
      const matchDispatched = showDispatched && s === "DISPATCHED";
      const matchCompleted = showCompleted && (s === "COMPLETED" || s === "DONE");

      // if EVERYTHING is off → show all (makes your SUPERADMIN view safer)
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

  // open drawer
  async function openDrawer(id: string) {
    setShowDrawer(true);
    setDrawerId(id);
    setDrawerErr("");
    setDrawerBusy(true);
    try {
      const data = await fetchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(id)}`);
      setDrawerRow(data);

      const curStatus = (data.status as UiStatus) || "NEW";
      setDStatus(curStatus);
      setDService(String(data.service || ""));
      setDFmc(String(data.fmc || ""));
      setDPo(String(data.po || ""));
      setDMileage(data.mileage != null ? String(data.mileage) : "");
      setDScheduledAt(data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 16) : "");

      const n = (data.notes_list || []).map((n) => ({
        id: n.id,
        text: n.text,
        created_at: n.created_at ?? null,
      }));
      setNotes(n);
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

  // save drawer
  async function saveDetails() {
    if (!drawerId) return;
    setDrawerBusy(true);
    setDrawerErr("");
    try {
      const body: any = {
        status: dStatus || null,
        service: dService || null,
        fmc: dFmc || null,
        po: dPo || null,
        mileage: dMileage ? Number(dMileage) : null,
        scheduled_at: dScheduledAt ? new Date(dScheduledAt).toISOString() : null,
      };

      const updated = await patchJSON<RequestDetails>(
        `/api/requests/${encodeURIComponent(drawerId)}`,
        body
      );
      setDrawerRow(updated);

      // update list
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

  // add note
  async function addNote() {
    if (!drawerId) return;
    const text = newNote.trim();
    if (!text) return;
    setNoteBusy(true);
    setNoteErr("");
    try {
      let noteResp: { id: string; text: string; created_at?: string | null } | null = null;
      try {
        noteResp = await postJSON(`/api/requests/${encodeURIComponent(drawerId)}/notes`, { text });
      } catch {
        const d = await patchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(drawerId)}`, {
          add_note: text,
        });
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

  // remove note
  async function removeNote(id: string) {
    if (!drawerId) return;
    setNoteBusy(true);
    setNoteErr("");
    try {
      try {
        await delJSON(`/api/requests/${encodeURIComponent(drawerId)}/notes/${encodeURIComponent(id)}`);
      } catch {
        await patchJSON<RequestDetails>(`/api/requests/${encodeURIComponent(drawerId)}`, {
          remove_note_id: id,
        });
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
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showNew} onChange={(e) => setShowNew(e.target.checked)} />
          <span>NEW</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showWaitingSched}
            onChange={(e) => setShowWaitingSched(e.target.checked)}
          />
          <span>WAITING TO BE SCHEDULED</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showWaitingApproval}
            onChange={(e) => setShowWaitingApproval(e.target.checked)}
          />
          <span>WAITING APPROVAL</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDeclined}
            onChange={(e) => setShowDeclined(e.target.checked)}
          />
          <span>DECLINED</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showWaitingParts}
            onChange={(e) => setShowWaitingParts(e.target.checked)}
          />
          <span>WAITING FOR PARTS</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showScheduled}
            onChange={(e) => setShowScheduled(e.target.checked)}
          />
          <span>SCHEDULED</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showInProgress}
            onChange={(e) => setShowInProgress(e.target.checked)}
          />
          <span>IN PROGRESS</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDispatched}
            onChange={(e) => setShowDispatched(e.target.checked)}
          />
          <span>DISPATCHED</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span>COMPLETED</span>
        </label>
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
            {filteredRows.map((r) => (
              <tr
                key={r.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => openDrawer(r.id)}
              >
                <td className="px-3 py-2">{r.customer?.name || "—"}</td>
                <td className="px-3 py-2">{renderVehicle(r.vehicle)}</td>
                <td className="px-3 py-2">{r.service || "—"}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">{r.priority || "—"}</td>
                <td className="px-3 py-2">{fmtDate(r.scheduled_at)}</td>
                <td className="px-3 py-2">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Drawer */}
      {showDrawer ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget && !drawerBusy && !noteBusy) closeDrawer();
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
                {/* Editable top */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="block mb-1">Status</span>
                    <select
                      className="border rounded-md px-3 py-2 w-full"
                      value={dStatus}
                      onChange={(e) => setDStatus(e.target.value as UiStatus)}
                      disabled={drawerBusy}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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

                  <label className="block text-sm">
                    <span className="block mb-1">Scheduled (optional)</span>
                    <input
                      type="datetime-local"
                      className="border rounded-md px-3 py-2 w-full"
                      value={dScheduledAt}
                      onChange={(e) => setDScheduledAt(e.target.value)}
                      disabled={drawerBusy}
                    />
                  </label>
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
                    {/* this is the spot you wanted so Office can SEE what Dispatch picked */}
                    <div>{drawerRow.technician?.name || drawerRow.technician?.id || "—"}</div>
                  </div>
                </div>

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

                {/* Notes */}
                <div className="pt-3">
                  <div className="text-base font-semibold mb-2">Notes</div>
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
                      {notes.map((n) => (
                        <li key={n.id} className="border rounded-md p-3">
                          <div className="text-sm whitespace-pre-wrap">{n.text}</div>
                          <div className="text-xs text-gray-500 mt-1">{fmtDate(n.created_at)}</div>
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
                      ))}
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
