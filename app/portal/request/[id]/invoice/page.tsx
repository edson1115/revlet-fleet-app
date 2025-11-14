// app/portal/requests/[id]/invoice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CustomerInvoicePreviewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        credentials: "include",
      });
      const js = await res.json();
      setRow(js);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading invoice…</div>;
  if (!row) return <div className="p-6">Not found.</div>;

  const v = row.vehicle;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Invoice Preview</h1>

      {/* VEHICLE */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="text-sm text-gray-500">Vehicle</div>
        <div className="text-lg font-medium">
          {[v?.year, v?.make, v?.model].filter(Boolean).join(" ")}
        </div>
        <div className="text-gray-600 text-sm">{v?.plate || v?.unit_number}</div>
      </div>

      {/* PARTS */}
      <div className="border rounded-2xl p-4 bg-white space-y-3">
        <h2 className="text-lg font-semibold">Parts Used</h2>

        {!row.parts?.length ? (
          <div className="text-gray-500 text-sm">No parts used.</div>
        ) : (
          row.parts.map((p: any) => (
            <div key={p.id} className="flex justify-between border-b py-1">
              <span>{p.part_name}</span>
              <span className="text-gray-500 text-sm">
                {p.part_number || "—"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* NOTES */}
      <div className="border rounded-2xl p-4 bg-white">
        <div className="text-lg font-semibold mb-2">Tech Notes</div>
        <div className="whitespace-pre-wrap text-sm text-gray-700">
          {row.notes || "—"}
        </div>
      </div>

      {/* DOWNLOAD PDF */}
      <a
        href={`/api/portal/invoice/${id}`}
        className="px-4 py-2 inline-block bg-black text-white rounded text-sm"
      >
        Download PDF Invoice
      </a>
    </div>
  );
}
