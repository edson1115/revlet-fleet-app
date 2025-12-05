"use client";

import { useEffect, useState } from "react";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import { RequestImageModal } from "@/components/RequestImageModal";

type Part = { id: string; name: string; qty: number };

type Req = {
  id: string;
  status: string;
  service?: string | null;

  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;

  created_at?: string | null;

  customer?: {
    id: string;
    name?: string | null;
  } | null;

  vehicle?: {
    id: string;
    unit_number?: string | null;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
  } | null;

  images?: {
    id: string;
    url_full?: string | null;
    url_thumb?: string | null;
    type?: string | null;
    created_at?: string | null;
  }[];
};

async function getJSON<T>(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json() as Promise<T>;
}

async function patchJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.ok === false) {
    throw new Error(json.error || "Update failed");
  }

  return json as T;
}

async function postJSON<T>(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export default function RequestDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [req, setReq] = useState<Req | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // PARTS state
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState("1");

  // NOTES state
  const [noteText, setNoteText] = useState("");

  // IMAGES state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---------------------------------------------------------
  // LOAD REQUEST + PARTS
  // ---------------------------------------------------------
  async function refresh() {
    setErr("");
    const data = await getJSON<any>(`/api/requests/${id}`);

    setReq(data.request);
    setParts(data.parts || []);
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e: any) {
        if (active) setErr(e.message);
      } finally {
        setLoading(false);
        active = false;
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  // ---------------------------------------------------------
  // STATUS ACTIONS
  // ---------------------------------------------------------
  async function startJob() {
    await patchJSON(`/api/requests/${id}`, { action: "start_job" });
    await refresh();
  }

  async function completeJob() {
    await patchJSON(`/api/requests/${id}`, { action: "complete_job" });
    await refresh();
  }

  async function reopenJob() {
    await patchJSON(`/api/requests/${id}`, {
      action: "send_back",
      dispatch_notes: "Reopened",
    });
    await refresh();
  }

  // ---------------------------------------------------------
  // PART ACTIONS
  // ---------------------------------------------------------
  async function addPart() {
    if (!newPartName.trim()) return;

    await postJSON(`/api/requests/${id}/parts`, {
      name: newPartName.trim(),
      qty: Number(newPartQty),
    });

    setNewPartName("");
    setNewPartQty("1");

    await refresh();
  }

  async function updateQty(partId: string, qty: number) {
    if (qty < 1) qty = 1;

    await fetch(`/api/requests/${id}/parts`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: partId, qty }),
    });

    await refresh();
  }

  async function deletePart(partId: string) {
    await fetch(`/api/requests/${id}/parts`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: partId }),
    });

    await refresh();
  }

  // ---------------------------------------------------------
  // NOTES
  // ---------------------------------------------------------
  async function addNote() {
    if (!noteText.trim()) return;

    await patchJSON(`/api/requests/${id}`, {
      action: "update_notes",
      internal_notes: noteText.trim(),
    });

    setNoteText("");
    await refresh();
  }

  async function generateAISummary() {
    const summary = `AI Summary: Request ${id} — quick overview (placeholder).`;
    setNoteText(summary);
  }

  // ---------------------------------------------------------
  // IMAGE UPLOAD
  // ---------------------------------------------------------
  async function uploadImage(file: File, kind: "before" | "after" | "other") {
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("request_id", id);
    form.append("kind", kind);

    const res = await fetch("/api/images/upload", {
      method: "POST",
      body: form,
      credentials: "include",
    });

    setUploading(false);

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Upload failed");
      return;
    }

    await refresh();
  }

  function ImageUploadButton({
    label,
    kind,
  }: {
    label: string;
    kind: "before" | "after" | "other";
  }) {
    return (
      <label className="px-3 py-1.5 border rounded-md text-xs bg-white cursor-pointer hover:bg-gray-50">
        {label}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f, kind);
          }}
        />
      </label>
    );
  }

  // ---------------------------------------------------------
  // TIMELINE
  // ---------------------------------------------------------
  function Timeline() {
    if (!req) return null;

    const steps = [
      { label: "NEW", ts: req.created_at },
      { label: "SCHEDULED", ts: req.scheduled_start_at },
      { label: "IN_PROGRESS", ts: req.started_at },
      { label: "COMPLETED", ts: req.completed_at },
    ];

    return (
      <div className="mt-4 space-y-4">
        <h3 className="font-semibold text-sm text-gray-700">Timeline</h3>

        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                s.ts ? "bg-black" : "bg-gray-300"
              }`}
            ></div>

            <div className="flex flex-col">
              <span className="text-sm font-medium">{s.label}</span>
              <span className="text-xs text-gray-500">
                {s.ts ? new Date(s.ts).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI RENDER
  // ---------------------------------------------------------
  if (loading || !req) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute right-0 top-0 h-full w-[580px] bg-white shadow-xl p-6 overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Request #{req.id}</h2>
          <button
            className="px-3 py-1 rounded-md border"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {err && (
          <div className="mb-4 text-sm text-red-800 bg-red-100 p-3 rounded-md border border-red-300">
            {err}
          </div>
        )}

        {/* STATUS & ACTIONS */}
        <div className="flex items-center justify-between mb-6">
          <TeslaStatusChip status={req.status} size="sm" />

          <div className="flex gap-2">
            {req.status !== "IN_PROGRESS" &&
              req.status !== "COMPLETED" && (
                <button
                  className="px-3 py-1 bg-black text-white rounded-md text-sm"
                  onClick={startJob}
                >
                  Start
                </button>
              )}

            {req.status === "IN_PROGRESS" && (
              <button
                className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                onClick={completeJob}
              >
                Complete
              </button>
            )}

            {req.status === "COMPLETED" && (
              <button
                className="px-3 py-1 bg-gray-200 rounded-md text-sm"
                onClick={reopenJob}
              >
                Reopen
              </button>
            )}
          </div>
        </div>

        {/* VEHICLE CARD */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Vehicle
          </h3>
          <div className="text-sm">
            {req.vehicle?.year} {req.vehicle?.make} {req.vehicle?.model}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Unit {req.vehicle?.unit_number} • Plate {req.vehicle?.plate}
          </div>
        </div>

        {/* TIMELINE */}
        <Timeline />

        <hr className="my-6" />

        {/* IMAGES SECTION */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Photos</h3>

          <div className="flex gap-2 mb-4">
            <ImageUploadButton label="Upload Before" kind="before" />
            <ImageUploadButton label="Upload After" kind="after" />
            <ImageUploadButton label="Upload Other" kind="other" />
          </div>

          {uploading && (
            <div className="text-xs text-gray-500 mb-3">Uploading…</div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {(req.images ?? []).map((img) => (
              <div
                key={img.id}
                className="rounded-md overflow-hidden border cursor-pointer"
                onClick={() =>
                  setPreviewUrl(img.url_full || img.url_thumb || "")
                }
              >
                <img
                  src={img.url_thumb || img.url_full || ""}
                  alt=""
                  className="w-full h-24 object-cover"
                />
              </div>
            ))}

            {(req.images ?? []).length === 0 && (
              <div className="text-sm text-gray-500">
                No photos uploaded.
              </div>
            )}
          </div>
        </div>

        <hr className="my-6" />

        {/* PARTS */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2">Parts Used</h3>

          <div className="space-y-2">
            {parts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border p-2 rounded-md"
              >
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    Qty: {p.qty}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 border rounded-md text-xs"
                    onClick={() => updateQty(p.id, p.qty - 1)}
                  >
                    -
                  </button>

                  <button
                    className="px-2 py-1 border rounded-md text-xs"
                    onClick={() => updateQty(p.id, p.qty + 1)}
                  >
                    +
                  </button>

                  <button
                    className="px-2 py-1 text-red-600 text-sm"
                    onClick={() => deletePart(p.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}

            {parts.length === 0 && (
              <div className="text-sm text-gray-500">No parts added.</div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="Part name"
              className="flex-1 border rounded-md px-2 py-1 text-sm"
            />

            <input
              value={newPartQty}
              onChange={(e) => setNewPartQty(e.target.value)}
              type="number"
              min="1"
              className="w-20 border rounded-md px-2 py-1 text-sm"
            />

            <button
              onClick={addPart}
              className="px-3 py-1 bg-black text-white rounded-md text-sm"
            >
              Add
            </button>
          </div>
        </div>

        <hr className="my-6" />

        {/* NOTES */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2">Notes</h3>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add notes…"
            className="w-full min-h-24 border rounded-md p-2 text-sm"
          />

          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-black text-white rounded-md text-sm"
              onClick={addNote}
            >
              Add Note
            </button>

            <button
              className="px-3 py-1 bg-gray-200 rounded-md text-sm"
              onClick={generateAISummary}
            >
              AI Summary
            </button>
          </div>
        </div>
      </div>

      {previewUrl && (
        <RequestImageModal
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
}
