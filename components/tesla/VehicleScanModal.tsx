// components/tesla/VehicleScanModal.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function VehicleScanModal({
  open,
  vehicle,
  onClose,
}: {
  open: boolean;
  vehicle: any;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!open || !vehicle) return null;

  async function runScan() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/ai/vehicle-scan", {
      method: "POST",
      body: JSON.stringify({ vehicle_id: vehicle.id }),
    });

    const js = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(js.error || "AI scan failed");
      return;
    }

    setResult(js);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[900]"
    >
      {/* MODAL PANEL */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Vehicle Scan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* VEHICLE LABEL */}
        <p className="text-sm text-gray-600 mb-4">
          {vehicle.year} {vehicle.make} {vehicle.model} — Plate {vehicle.plate}
        </p>

        {/* SCAN BUTTON */}
        {!result && (
          <button
            onClick={runScan}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            {loading ? "Scanning…" : "Start AI Scan"}
          </button>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Detected Issues:</h3>

            <div className="border rounded-xl bg-gray-50 p-4 text-sm">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
