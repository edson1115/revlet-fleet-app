"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function DraftPreview({
  requestId,
  onSubmitted,
}: {
  requestId: string;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [err, setErr] = useState("");

  async function generateDraft() {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/autointegrate/draft", {
        method: "POST",
        body: JSON.stringify({ requestId }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed to generate draft");
      setPayload(js.payload);
      setOpen(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitDraft() {
    try {
      const res = await fetch("/api/autointegrate/submit", {
        method: "POST",
        body: JSON.stringify({ requestId }),
      });
      const js = await res.json();
      if (!res.ok) throw new Error(js.error || "Failed to submit");
      onSubmitted?.();
      setOpen(false);
      alert("Submitted to AutoIntegrate!");
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <>
      {/* Button */}
      <button
        className="px-4 py-2 rounded-lg bg-black text-white text-sm"
        onClick={generateDraft}
        disabled={loading}
      >
        {loading ? "Preparing Draft…" : "Generate AutoIntegrate Draft"}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              AutoIntegrate Draft Preview
            </h2>

            {payload ? (
              <pre className="bg-gray-100 rounded-lg p-4 text-xs max-h-[400px] overflow-auto border">
                {JSON.stringify(payload, null, 2)}
              </pre>
            ) : (
              <div className="text-sm text-gray-600">No draft loaded.</div>
            )}

            {err && (
              <div className="mt-3 text-sm text-red-600">{err}</div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setOpen(false)}
              >
                Close
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-black text-white"
                onClick={submitDraft}
              >
                Submit to AutoIntegrate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
