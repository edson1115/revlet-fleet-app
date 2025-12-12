"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { toast } from "@/components/ui/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  vehicle: any; // from VehicleDrawer
};

export function VehicleAIBrain({ open, onClose, vehicle }: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  async function runAI() {
    if (!vehicle) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/ai/vehicle-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vehicle,
        }),
      });

      const js = await res.json();
      if (!res.ok) throw new Error(js.error);

      setAnalysis(js.analysis);
      toast({ title: "AI analysis complete" });
    } catch (err: any) {
      console.error("AI Brain error:", err);
      toast({
        title: "AI error",
        description: err.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  }

  // Run AI when panel opens
  useEffect(() => {
    if (open) runAI();
  }, [open]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[999] flex transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* BACKDROP */}
      <div
        className={clsx(
          "flex-1 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* DRAWER */}
      <div
        className={clsx(
          "w-[520px] max-w-full bg-white shadow-xl h-full overflow-y-auto transform transition-all duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 mb-3 hover:text-black"
          >
            ← Back
          </button>

          <h2 className="text-[22px] font-semibold tracking-tight">
            Revlet AI Assistant
          </h2>
          <p className="text-sm text-gray-500">
            Vehicle intelligence powered by GPT-4.1
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-gray-500 animate-pulse">Analyzing…</div>
          )}

          {!loading && analysis && (
            <>
              {/* PO Extraction */}
              <div className="rounded-xl border p-4 bg-gray-50">
                <div className="font-semibold text-lg mb-2">
                  Detected PO Number
                </div>
                <div className="text-gray-700 text-sm">
                  {analysis.po_number || "No PO detected."}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border p-4">
                <div className="font-semibold text-lg mb-2">Summary</div>
                <p className="text-gray-700 text-sm whitespace-pre-line">
                  {analysis.summary}
                </p>
              </div>

              {/* Diagnosis */}
              <div className="rounded-xl border p-4 bg-gray-50">
                <div className="font-semibold text-lg mb-2">Diagnosis</div>
                <p className="text-gray-700 text-sm whitespace-pre-line">
                  {analysis.diagnosis}
                </p>
              </div>

              {/* Recommendations */}
              <div className="rounded-xl border p-4">
                <div className="font-semibold text-lg mb-2">
                  Recommended Actions
                </div>

                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
                  {analysis.recommendations?.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <button
                onClick={() =>
                  (window.location.href = `/customer/requests/new?vehicle_id=${vehicle.id}`)
                }
                className="w-full py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 mt-6"
              >
                Create Service Request
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
