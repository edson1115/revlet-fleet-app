"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

export default function DispatchTireOrdersPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/tire-order/list")
      .then((r) => r.json())
      .then((js) => js.ok && setRows(js.rows));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <TeslaHeroBar title="Tire Orders" subtitle="Dispatch Review" />

      <div className="bg-white rounded-xl divide-y border">
        {rows.map((r: any) => (
          <TeslaListRow
            key={r.id}
            title={`${r.size} (${r.qty}) — ${r.vendor}`}
            value={r.status}
            href={`/dispatch/tires/${r.id}`}
          />
        ))}
      </div>
    </div>
  );
}
