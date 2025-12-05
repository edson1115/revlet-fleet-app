// components/request/RequestPartsPanel.tsx
"use client";

import { useEffect, useState } from "react";

type Part = {
  id: string;
  name: string;
  qty: number;
};

export default function RequestPartsPanel({ requestId }: { requestId: string }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);

  async function load() {
    const r = await fetch(`/api/requests/${requestId}/parts`);
    const js = await r.json();
    setParts(js.rows || []);
  }

  async function addPart() {
    const r = await fetch(`/api/requests/${requestId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, qty }),
    });
    if (r.ok) {
      setName("");
      setQty(1);
      load();
    }
  }

  async function removePart(id: string) {
    await fetch(`/api/requests/${requestId}/parts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm space-y-4">
      <div className="text-xs uppercase text-gray-500">Parts Used</div>

      <div className="space-y-2">
        {parts.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between border rounded-xl p-2"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">Qty: {p.qty}</div>
            </div>
            <button
              onClick={() => removePart(p.id)}
              className="text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
        ))}

        {parts.length === 0 && (
          <div className="text-sm text-gray-500">No parts added</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded-xl px-3 py-2 flex-1"
          placeholder="Part name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          className="border rounded-xl px-3 py-2 w-20"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />

        <button
          onClick={addPart}
          className="px-3 py-2 bg-black text-white rounded-xl"
        >
          Add
        </button>
      </div>
    </div>
  );
}
