"use client";

import { useState } from "react";

export default function ConvertLead({ lead }: any) {
  const [loading, setLoading] = useState(false);

  // Safety check: Don't render if lead data is missing
  if (!lead) return null;

  async function convert(type: "APPROVED" | "REQUIRES") {
    if (!confirm("Are you sure you want to convert this lead?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/convert`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      
      if (res.ok) {
        alert("Conversion complete!");
        // Optional: Refresh or redirect here
      } else {
        alert("Error converting lead.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-6 p-4 border-t">
      <h3 className="font-semibold text-lg">Convert Lead</h3>

      <div className="space-y-3">
        <button
          onClick={() => convert("APPROVED")}
          disabled={loading}
          className="w-full bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {loading ? "Processing..." : "Schedule Service — Approved"}
        </button>

        <button
          onClick={() => convert("REQUIRES")}
          disabled={loading}
          className="w-full bg-yellow-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-yellow-700 disabled:opacity-50 transition"
        >
          {loading ? "Processing..." : "Schedule Service — Requires Approval"}
        </button>
      </div>
    </div>
  );
}