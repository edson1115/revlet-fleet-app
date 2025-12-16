"use client";

import React from "react";
import { TeslaServiceCard } from "./TeslaServiceCard";
import TeslaSection from "./TeslaSection";


export type PartLine = {
  id?: string;
  name: string;
  qty: number;
};

export function TeslaPartsCard({
  parts,
  setParts,
}: {
  parts: PartLine[];
  setParts: (next: PartLine[]) => void;
}) {
  function updatePart(i: number, field: keyof PartLine, value: any) {
    const next = [...parts];
    // @ts-ignore
    next[i][field] = value;
    setParts(next);
  }

  function addPart() {
    setParts([
      ...parts,
      { id: crypto.randomUUID(), name: "", qty: 1 },
    ]);
  }

  function removePart(i: number) {
    const next = [...parts];
    next.splice(i, 1);
    setParts(next);
  }

  return (
    <TeslaServiceCard title="Parts Used">
      {parts.length === 0 && (
        <div className="text-sm text-gray-500">No parts added.</div>
      )}

      {parts.map((p, i) => (
        <TeslaSection key={p.id || i} label={`Part ${i + 1}`}>
          <div className="flex flex-col gap-2">
            <input
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              placeholder="Part name / description"
              value={p.name}
              onChange={(e) => updatePart(i, "name", e.target.value)}
            />

            <input
              type="number"
              min={1}
              className="w-24 bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={p.qty}
              onChange={(e) =>
                updatePart(i, "qty", Number(e.target.value) || 1)
              }
            />

            <button
              onClick={() => removePart(i)}
              className="text-xs text-red-600 mt-1"
            >
              Remove
            </button>
          </div>
        </TeslaSection>
      ))}

      <button
        onClick={addPart}
        className="mt-3 px-4 py-2 bg-black text-white rounded-lg text-sm"
      >
        + Add Part
      </button>
    </TeslaServiceCard>
  );
}



