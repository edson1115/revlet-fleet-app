"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeslaAIScanModal({
  open,
  vehicleId,
  onClose,
  onResult,
}: {
  open: boolean;
  vehicleId: string;
  onClose: () => void;
  onResult: (r: any) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  async function submitScan() {
    if (!files.length) return;

    setLoading(true);
    const form = new FormData();
    files.forEach((f) => form.append("photos", f));

    const res = await fetch(`/api/customer/vehicles/${vehicleId}/ai-health`, {
      method: "POST",
      body: form,
    });

    const js = await res.json();
    setLoading(false);

    if (!js.ok) {
      alert(js.error);
      return;
    }
    onResult(js);
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4 z-[600]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ y: 200 }}
          animate={{ y: 0 }}
          exit={{ y: 200 }}
          className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-xl font-semibold mb-4">AI Vehicle Scan</h2>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="border p-3 rounded-lg w-full"
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={submitScan}
              className="px-4 py-2 bg-black text-white rounded-lg"
              disabled={loading}
            >
              {loading ? "Analyzing…" : "Run Scan"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
