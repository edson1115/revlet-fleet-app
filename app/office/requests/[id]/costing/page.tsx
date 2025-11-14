"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PartRow = {
  id: string;
  part_name: string;
  part_number?: string | null;
  cost?: number | null;
};

export default function OfficeCostingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [parts, setParts] = useState<PartRow[]>([]);
  const [laborRate, setLaborRate] = useState(95); // default
  const [accountingNote, setAccountingNote] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const js = await res.json();
      setRow(js);
      setParts(js.parts || []);
    } catch {
      setRow(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!row) return <div className="p-6">Request not found.</div>;

  // ------------- COST LOGIC -------------
  // labor hours
  let laborHours = 0;
  if (row.started_at && row.completed_at) {
    const start = new Date(row.started_at).getTime();
    const end = new Date(row.completed_at).getTime();
    const diff = (end - start) / 1000 / 60 / 60;
    laborHours = Math.max(0, diff);
  }

  const laborCost = laborHours * Number(laborRate || 0);

  // parts cost
  const partsCost = parts.reduce(
    (sum, p) => sum + (Number(p.cost) || 0),
    0
  );

  const totalCost = laborCost + partsCost;

  async function saveNote() {
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        office_notes: accountingNote,
      }),
    });

    alert("Saved!");
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Costing Summary</h1>
        <button
          onClick={() => router.back()}
          className="text-blue-600 underline text-sm"
        >
          Back
        </button>
      </div>

      {/* VEHICLE */}
      <div className="border p-4 rounded-xl bg-white space-y-1">
        <div className="text-sm text-gray-500">Vehicle</div>
        <div className="text-lg font-semibold">
          {[row.vehicle?.year, row.vehicle?.make, row.vehicle?.model]
            .filter(Boolean)
            .join(" ")}
        </div>
      </div>

      {/* LABOR */}
      <div className="border p-4 rounded-xl bg-white space-y-4">
        <h2 className="text-lg font-semibold">Labor</h2>

        <div className="text-sm text-gray-600">
          <strong>Start:</strong> {row.started_at ? new Date(row.started_at).toLocaleString() : "—"}
        </div>

        <div className="text-sm text-gray-600">
          <strong>End:</strong> {row.completed_at ? new Date(row.completed_at).toLocaleString() : "—"}
        </div>

        <div className="text-sm">
          <strong>Total Hours:</strong> {laborHours.toFixed(2)}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Labor Rate ($/hr)</label>
          <input
            type="number"
            value={laborRate}
            onChange={(e) => setLaborRate(Number(e.target.value))}
            className="border rounded p-2 w-full"
          />
        </div>

        <div className="text-xl font-semibold">
          Labor Cost: ${laborCost.toFixed(2)}
        </div>
      </div>

      {/* PARTS */}
      <div className="border p-4 rounded-xl bg-white space-y-3">
        <h2 className="text-lg font-semibold">Parts Used</h2>

        {parts.length === 0 ? (
          <div className="text-sm text-gray-600">No parts added.</div>
        ) : (
          <div className="space-y-2">
            {parts.map((p) => (
              <div key={p.id} className="border p-3 rounded-xl bg-gray-50">
                <div className="font-medium">{p.part_name}</div>
                <div className="text-xs text-gray-500">{p.part_number || "—"}</div>

                <div className="mt-2">
                  <label className="text-xs text-gray-600">Cost ($)</label>
                  <input
                    type="number"
                    defaultValue={p.cost || ""}
                    className="border rounded p-1 w-full mt-1"
                    onBlur={async (e) => {
                      await fetch(`/api/requests/${id}/parts/${p.id}`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          cost: Number(e.target.value || 0),
                        }),
                      });
                      load();
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xl font-semibold">
          Parts Total: ${partsCost.toFixed(2)}
        </div>
      </div>

      {/* TOTAL */}
      <div className="border p-4 rounded-xl bg-white">
        <h2 className="text-lg font-semibold mb-2">Total Cost</h2>
        <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
      </div>

      {/* NOTES */}
      <div className="border p-4 rounded-xl bg-white space-y-3">
        <h2 className="text-lg font-semibold">Office Notes (for Accounting)</h2>

        <textarea
          rows={3}
          value={accountingNote}
          onChange={(e) => setAccountingNote(e.target.value)}
          className="border rounded p-3 w-full"
        />

        <button
          onClick={saveNote}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Save Note
        </button>
      </div>

    </div>
  );
}
