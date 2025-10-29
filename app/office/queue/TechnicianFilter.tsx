// app/office/queue/TechnicianFilter.tsx
"use client";

import { useEffect, useState } from "react";

type Tech = { id: string; name: string };

export default function TechnicianFilter({
  onChange,
  initial,
}: {
  onChange: (techId: string | null) => void;
  initial?: string | null;
}) {
  const [techs, setTechs] = useState<Tech[]>([]);
  const [value, setValue] = useState<string>(initial ?? "");

  useEffect(() => {
    // Replace with your lookups endpoint if different
    fetch("/api/lookups?scope=technicians")
      .then((r) => r.json())
      .then((j) => setTechs(j?.data ?? []))
      .catch(() => setTechs([]));
  }, []);

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Technician:</span>
      <select
        className="border rounded-md px-2 py-1"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          onChange(v || null);
        }}
      >
        <option value="">All</option>
        {techs.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
