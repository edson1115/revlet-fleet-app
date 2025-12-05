"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useRequestPhotos } from "@/lib/hooks/useRequestPhotos";
import { useRequestRealtime } from "@/lib/hooks/useRequestRealtime";

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
   PARTS PANEL (uses existing API)
   =================================================================== */

function PartsPanel({ id }: { id: string }) {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPartName, setNewPartName] = useState("");
  const [newPartNumber, setNewPartNumber] = useState("");

  async function loadParts() {
    setLoading(true);
    const res = await fetch(`/api/requests/${id}/parts`, {
      credentials: "include",
    });
    const js = await res.json();
    if (js.ok) setParts(js.parts);
    setLoading(false);
  }

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
    loadParts();
  }

  async function removePart(partId: string) {
    await fetch(`/api/requests/${id}/parts/${partId}`, {
      method: "DELETE",
      credentials: "include",
    });

    loadParts();
  }

  useEffect(() => {
    loadParts();
  }, [id]);

  return (
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
        {loading && <div className="text-sm text-gray-500">Loading parts…</div>}

        {!loading && parts.length === 0 && (
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

            <button
              onClick={() => removePart(p.id)}
              className="text-xs px-2 py-1 border rounded text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================================================================
   PHOTO SECTION
   =================================================================== */

function PhotoSection({
  title,
  kind,
  photos,
  onUpload,
}: {
  title: string;
  kind: "before" | "after" | "other";
  photos: any[];
  onUpload: (k: "before" | "after" | "other") => void;
}) {
  const filtered = photos.filter((p) => p.kind === kind);

  return (
    <div className="border rounded-2xl p-4 bg-white space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>

        <button
          onClick={() => onUpload(kind)}
          className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50"
        >
          + Add {title.split(" ")[0]} Photo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="relative">
            <img
              src={p.url_thumb || p.url || ""}
              className="w-full h-40 object-cover rounded-xl border cursor-pointer"
              onClick={() => window.open(p.url_thumb, "_blank")}
            />

            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
              {p.kind.toUpperCase()}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-gray-400 text-sm">No photos yet.</div>
        )}
      </div>
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

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [techNotes, setTechNotes] = useState("");
  const [recommend, setRecommend] = useState("");
  const [sendBackReason, setSendBackReason] = useState("");
  const [mileage, setMileage] = useState("");

  const { photos, refresh: refreshPhotos } = useRequestPhotos(id);

  /* ---------------------------------------------------------
     Realtime: listen to service_requests + images
     --------------------------------------------------------- */
  useRequestRealtime(id, () => load());
  useRequestRealtime(id, () => refreshPhotos()); // images update too

  /* ---------------------------------------------------------
     Load the request
     --------------------------------------------------------- */
  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`/api/requests/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const js = await res.json();
      if (js.ok) {
        setRequest(js.request);
        setMileage(js.request.mileage || "");
      }
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------------------------------------------------
     Status updates
     --------------------------------------------------------- */

  async function startJob() {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start_job" }),
    });

    load();
  }

  async function completeJob() {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      }),
    });

    load();
  }

  async function sendBack() {
    if (!sendBackReason.trim()) return;

    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "WAITING_TO_BE_SCHEDULED",
        dispatch_notes: sendBackReason,
      }),
    });

    setSendBackReason("");
    load();
  }

  async function saveTechNotes() {
    if (!techNotes.trim()) return;

    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: `TECH: ${techNotes}` }),
    });

    setTechNotes("");
    load();
  }

  async function saveRecommendation() {
    if (!recommend.trim()) return;

    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dispatch_notes: `RECOMMENDATION: ${recommend}`,
      }),
    });

    setRecommend("");
    load();
  }

  async function saveMileage() {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mileage: Number(mileage) || null }),
    });

    load();
  }

  /* ---------------------------------------------------------
     Photo Upload
     --------------------------------------------------------- */
  async function uploadPhoto(kind: "before" | "after" | "other", file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("request_id", id);
    form.append("kind", kind);

    await fetch(`/api/images/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });

    refreshPhotos();
  }

  function pickFile(kind: "before" | "after" | "other") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) uploadPhoto(kind, file);
    };

    input.click();
  }

  /* ---------------------------------------------------------
     Lifecycle
     --------------------------------------------------------- */
  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  const v = request.vehicle;

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

      {/* STATUS */}
      <div className="border rounded-2xl p-4 bg-white space-y-4">
        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-xl font-semibold">{request.status}</div>
        </div>

        {/* Start Job */}
        {request.status === "SCHEDULED" && (
          <button
            onClick={startJob}
            className="px-4 py-2 bg-black text-white rounded w-full"
          >
            Start Job
          </button>
        )}

        {/* Complete Job */}
        {request.status === "IN_PROGRESS" && (
          <button
            onClick={completeJob}
            className="px-4 py-2 bg-[#80FF44] text-black rounded w-full"
          >
            Complete Job
          </button>
        )}

        {/* Send Back */}
        <textarea
          placeholder="Reason to send back"
          value={sendBackReason}
          onChange={(e) => setSendBackReason(e.target.value)}
          className="border rounded-lg p-2 w-full"
        />
        <button
          onClick={sendBack}
          className="px-4 py-2 bg-red-600 text-white rounded w-full"
        >
          Send Back to Dispatch
        </button>

        {request.started_at && (
          <div className="text-sm text-gray-600">
            Started: {new Date(request.started_at).toLocaleString()}
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

      {/* PARTS */}
      <PartsPanel id={id} />

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
          className="px-4 py-2 bg-black text-white rounded w-full"
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
          className="px-4 py-2 bg-black text-white rounded w-full"
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
          className="px-4 py-2 bg-black text-white rounded w-full"
        >
          Submit Recommendation
        </button>
      </div>

      {/* PHOTOS */}
      <PhotoSection
        title="Before Photos"
        kind="before"
        photos={photos}
        onUpload={pickFile}
      />

      <PhotoSection
        title="After Photos"
        kind="after"
        photos={photos}
        onUpload={pickFile}
      />

      <PhotoSection
        title="Other Photos"
        kind="other"
        photos={photos}
        onUpload={pickFile}
      />

      {/* COPILOT */}
      <TechCopilotPanel requestId={id} />
    </div>
  );
}
