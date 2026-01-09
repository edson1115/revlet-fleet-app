"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Save } from "lucide-react";

interface InspectionModalProps {
  requestId: string;
  onComplete: () => void;
  onClose: () => void;
}

const INSPECTION_POINTS = [
  { id: "lights", label: "Headlights & Signals" },
  { id: "wipers", label: "Wipers & Washers" },
  { id: "tires", label: "Tire Pressure & Tread" },
  { id: "fluids", label: "Oil & Fluid Levels" },
  { id: "brakes", label: "Brake Lines & Fluid" },
  { id: "battery", label: "Battery Health" },
  { id: "belts", label: "Belts & Hoses" },
  { id: "glass", label: "Windshield & Glass" },
  { id: "body", label: "Body Damage Check" },
];

export default function InspectionModal({ requestId, onComplete, onClose }: InspectionModalProps) {
  const [results, setResults] = useState<Record<string, "pass" | "fail" | "flag">>(
    // Initialize all as null or undefined, requiring user interaction? 
    // Or default to empty. Let's force interaction.
    {}
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleStatus = (id: string, status: "pass" | "fail" | "flag") => {
    setResults((prev) => ({ ...prev, [id]: status }));
  };

  const handleSubmit = async () => {
    // 1. Validation: Ensure all 9 points are checked
    const answeredCount = Object.keys(results).length;
    if (answeredCount < INSPECTION_POINTS.length) {
      alert(`Please complete all ${INSPECTION_POINTS.length} points.`);
      return;
    }

    setSubmitting(true);

    try {
      // 2. Save to DB
      const res = await fetch("/api/tech/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          checklist_data: results,
        }),
      });

      if (!res.ok) throw new Error("Failed to save inspection");

      onComplete(); // Tell parent we are done
      onClose();
      
    } catch (error) {
      console.error(error);
      alert("Error saving inspection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="font-bold text-lg text-gray-800">9-Point Inspection</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2">
            Close
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {INSPECTION_POINTS.map((point) => {
            const status = results[point.id];
            return (
              <div key={point.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{point.label}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => toggleStatus(point.id, "pass")}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === "pass" ? "bg-green-600 text-white" : "bg-white border text-gray-600"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Pass
                  </button>
                  
                  <button
                    onClick={() => toggleStatus(point.id, "flag")}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === "flag" ? "bg-yellow-500 text-white" : "bg-white border text-gray-600"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Flag
                  </button>

                  <button
                    onClick={() => toggleStatus(point.id, "fail")}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === "fail" ? "bg-red-600 text-white" : "bg-white border text-gray-600"
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Fail
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t bg-white pb-8 sm:pb-4 rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            {submitting ? "Saving..." : "Submit Inspection"}
          </button>
        </div>
      </div>
    </div>
  );
}