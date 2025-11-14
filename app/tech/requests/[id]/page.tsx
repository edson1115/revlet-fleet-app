"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* ===================================================================
   TECH COPILOT PANEL
   =================================================================== */
function TechCopilotPanel({ requestId }: { requestId: string }) {
  const [mode, setMode] = useState("explain");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const modes = [
    { key: "explain", label: "Explain Issue" },
    { key: "fix", label: "Suggest Fix" },
    { key: "parts", label: "Predict Parts" },
    { key: "summary", label: "Write Summary" },
    { key: "verify_part", label: "Verify Part" },
    { key: "custom", label: "Ask Anything" },
  ];

  async function runCopilot() {
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch("/api/tech/copilot", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          kind: mode,
          message: input || null,
        }),
      });

      const js = await res.json();
      setAnswer(js.answer || "No response.");
    } catch {
      setAnswer("Error contacting Copilot.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 p-6 border rounded-2xl bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Tech Copilot</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`px-3 py-1.5 border rounded-full text-sm ${
              m.key === mode ? "bg-black text-white" : "bg-white hover:bg-gray-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "custom" && (
        <textarea
          className="border rounded-md w-full p-3 text-sm mb-4"
          placeholder="Ask Copilot anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      )}

      <button
        onClick={runCopilot}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
      >
        {loading ? "Thinking…" : "Run Copilot"}
      </button>

      {answer && (
        <div className="mt-4 p-4 border rounded-xl bg-gray-50 whitespace-pre-wrap text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ===================================================================
   MAIN TECH REQUEST PAGE
   =================================================================== */

export default function TechRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [techNotes, setTechNotes] = useState("");
  const [mileage, setMileage] = useState("");
  const [recommend, setRecommend] = useState("");
  const [sendBackReason, setSendBackReason] = useState("");

  const [parts, setParts] = useState<any[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartNumber, setNewPartNumber] = useState("");

  const [photos, setPhotos] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const js = await res.json();
      setRow(js);
      setMileage(js.mileage || "");
      setParts(js.parts || []);
      setPhotos(js.photos || []);
    } catch {
      setRow(null);
    } finally {
      setLoading(false);
    }
  }

  // ---- CLOCK CONTROL ----
  async function startClock() {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "start" }),
    });
    load();
  }

  async function stopClock() {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "complete", note: null }),
    });
    load();
  }

  // ---- STATUS HELPERS ----
  async function updateStatus(status: string, extra: any = {}) {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      const js = await res.json();
      setRow(js);
    } finally {
      setSaving(false);
    }
  }

  async function saveTechNotes() {
    if (!techNotes.trim()) return;
    await updateStatus(row.status, { add_note: `tech: ${techNotes}` });
    setTechNotes("");
  }

  async function saveRecommendation() {
    if (!recommend.trim()) return;
    await updateStatus(row.status, { add_note: `recommendation: ${recommend}` });
    setRecommend("");
  }

  async function saveMileage() {
    await updateStatus(row.status, { mileage: Number(mileage) || null });
  }

  async function sendBack() {
    if (!sendBackReason.trim()) return;
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op: "reschedule",
        reason: sendBackReason,
      }),
    });
    setSendBackReason("");
    load();
  }

  // ---- PARTS ----
  async function addPart() {
    if (!newPartName.trim()) return;

    await fetch(`/api/requests/${id}/parts`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part_name: newPartName,
        part_number: newPartNumber || null,
      }),
    });

    setNewPartName("");
    setNewPartNumber("");
    load();
  }

  async function removePart(partId: string) {
    await fetch(`/api/requests/${id}/parts/${partId}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  }

  async function verifyPart(p: any) {
    const res = await fetch("/api/tech/copilot", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        kind: "verify_part",
        message: JSON.stringify({
          part_name: p.part_name,
          part_number: p.part_number,
          vehicle: row.vehicle,
        }),
      }),
    });

    const js = await res.json();
    alert(js.answer || "No response");
  }

  // ---- PHOTOS ----
  async function uploadPhoto(e: any, kind: "before" | "after") {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    await fetch(`/api/requests/${id}/photos`, {
      method: "POST",
      credentials: "include",
      body: form,
    });

    load();
  }

  async function deletePhoto(photo: any) {
    await fetch(`/api/requests/${id}/photos/${photo.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  }

  // ---- LOAD DATA ----
  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!row) return <div className="p-6">Request not found.</div>;

  const v = row.vehicle;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Request</h1>
        <button
          className="text-sm text-blue-600 underline"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      {/* STATUS + CLOCK */}
      <div className="border rounded-2xl p-4 bg-white space-y-4">

        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-xl font-semibold">{row.status}</div>
        </div>

        {/* ---- DOWNLOAD PDF BUTTON ---- */}
        <button
          onClick={() => window.open(`/api/requests/${id}/pdf`, "_blank")}
          className="px-4 py-2 bg-black text-white rounded w-full"
        >
          Download Service Report (PDF)
        </button>

        <button
  onClick={async () => {
    await fetch(`/api/requests/${id}/email`, { method: "POST" });
    alert("Service report emailed!");
  }}
  className="px-4 py-2 bg-green-600 text-white rounded w-full"
>
  Email Service Report
</button>


        {/* Start Clock */}
        {(!row.started_at ||
          row.status === "NEW" ||
          row.status === "WAITING_TO_BE_SCHEDULED") && (
          <button
            onClick={startClock}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Start Clock
          </button>
        )}

        {/* Stop Clock */}
        {row.status === "IN_PROGRESS" && (
          <button
            onClick={stopClock}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Stop Clock
          </button>
        )}

        {row.started_at && (
          <div className="text-sm text-gray-600">
            Started: {new Date(row.started_at).toLocaleString()}
          </div>
        )}

        {row.completed_at && (
          <div className="text-sm text-gray-600">
            Completed: {new Date(row.completed_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* VEHICLE */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="text-sm text-gray-500 mb-1">Vehicle</div>
        <div className="text-lg font-medium">
          {[v?.year, v?.make, v?.model].filter(Boolean).join(" ")}
        </div>
        <div className="text-gray-600 text-sm">
          {v?.plate || v?.unit_number || "—"}
        </div>
      </div>

      {/* CUSTOMER */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="text-sm text-gray-500">Customer</div>
        <div className="text-lg">{row.customer?.name || "—"}</div>
      </div>

      {/* PARTS PANEL */}
      <div className="border rounded-2xl p-4 bg-white space-y-4">
        <h2 className="text-lg font-semibold">Parts Used</h2>

        <div className="flex flex-col gap-2">
          <input
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            placeholder="Part name"
            className="border rounded p-2 w-full"
          />
          <input
            value={newPartNumber}
            onChange={(e) => setNewPartNumber(e.target.value)}
            placeholder="Part number (optional)"
            className="border rounded p-2 w-full"
          />
          <button
            onClick={addPart}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Add Part
          </button>
        </div>

        <div className="space-y-2">
          {parts.length === 0 && (
            <div className="text-sm text-gray-500">No parts added.</div>
          )}

          {parts.map((p) => (
            <div
              key={p.id}
              className="border rounded-xl p-3 flex items-center justify-between bg-gray-50"
            >
              <div>
                <div className="text-sm font-medium">{p.part_name}</div>
                <div className="text-xs text-gray-500">
                  {p.part_number || "—"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => verifyPart(p)}
                  className="text-xs px-2 py-1 border rounded text-blue-600"
                >
                  Verify
                </button>

                <button
                  onClick={() => removePart(p.id)}
                  className="text-xs px-2 py-1 border rounded text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MILEAGE */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="text-sm text-gray-600">Mileage</div>
        <input
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          type="number"
          className="border rounded-lg p-2 w-full"
        />
        <button
          onClick={saveMileage}
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
        >
          Save Mileage
        </button>
      </div>

      {/* TECH NOTES */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="text-sm font-medium">Tech Notes</div>
        <textarea
          className="border rounded-lg w-full p-3"
          rows={3}
          value={techNotes}
          onChange={(e) => setTechNotes(e.target.value)}
        />
        <button
          onClick={saveTechNotes}
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
        >
          Add Note
        </button>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="text-sm font-medium">Recommend Additional Services</div>
        <textarea
          className="border rounded-lg w-full p-3"
          rows={3}
          value={recommend}
          onChange={(e) => setRecommend(e.target.value)}
        />
        <button
          onClick={saveRecommendation}
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-40"
        >
          Submit Recommendation
        </button>
      </div>

      {/* SEND BACK */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <div className="text-sm font-medium">Reschedule / Send Back</div>
        <textarea
          className="border rounded-lg w-full p-3"
          rows={3}
          placeholder="Why is this being sent back?"
          value={sendBackReason}
          onChange={(e) => setSendBackReason(e.target.value)}
        />
        <button
          onClick={sendBack}
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-40"
        >
          Send Back to Dispatch
        </button>
      </div>

      {/* BEFORE / AFTER PHOTOS */}
      <div className="border rounded-2xl p-4 bg-white space-y-4">
        <h2 className="text-lg font-semibold">Photos</h2>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Upload Before Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadPhoto(e, "before")}
            className="border p-2 rounded"
          />

          <label className="text-sm font-medium">Upload After Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadPhoto(e, "after")}
            className="border p-2 rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              <img
                src={p.url}
                className="w-full h-40 object-cover rounded-xl border cursor-pointer"
                onClick={() => window.open(p.url, "_blank")}
              />

              <button
                className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded"
                onClick={() => deletePhoto(p)}
              >
                Delete
              </button>

              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                {p.kind.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* COPILOT */}
      <TechCopilotPanel requestId={id} />
    </div>
  );
}
