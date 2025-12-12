"use client";

export default function ConvertLead({ lead }: any) {
  async function convert(type: "APPROVED" | "REQUIRES") {
    await fetch(`/api/sales/leads/${lead.id}/convert`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
    alert("Conversion complete!");
  }

  return (
    <div className="space-y-4 pt-6 border-t">
      <h3 className="font-semibold text-lg">Convert Lead</h3>

      <button
        onClick={() => convert("APPROVED")}
        className="w-full bg-black text-white px-4 py-3 rounded-xl"
      >
        Schedule Service — Approved
      </button>

      <button
        onClick={() => convert("REQUIRES")}
        className="w-full bg-yellow-600 text-white px-4 py-3 rounded-xl"
      >
        Schedule Service — Requires Approval
      </button>
    </div>
  );
}
