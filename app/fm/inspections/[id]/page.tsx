// app/fm/inspections/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FMInspectionDetailPage({ params }: any) {
  const inspectionId = params.id;
  const router = useRouter();

  const [inspection, setInspection] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/fm/inspections/${inspectionId}`)
      .then((r) => r.json())
      .then((res) => setInspection(res.data || res));
  }, [inspectionId]);

  if (!inspection) {
    return <div className="p-6 text-gray-500">Loading inspection…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inspection #{inspectionId.slice(0, 6)}</h1>

      {/* DOWNLOAD PDF LINK */}
      <div className="mt-2">
        <a
          href={`/api/fm/inspections/${inspectionId}/pdf`}
          target="_blank"
          className="text-blue-600 underline text-lg"
        >
          Download PDF
        </a>
      </div>

      {/* BASIC INFO */}
      <div className="p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Customer</h2>
        <p className="text-gray-800">{inspection.customers?.name}</p>

        <h2 className="text-xl font-semibold mt-4 mb-2">Vehicle</h2>
        <p>{inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}</p>
        <p className="text-gray-600 text-sm">Unit: {inspection.vehicle?.unit_number}</p>
        <p className="text-gray-600 text-sm">Plate: {inspection.vehicle?.plate}</p>

        <h2 className="text-xl font-semibold mt-4 mb-2">Created</h2>
        <p className="text-gray-800">{new Date(inspection.created_at).toLocaleString()}</p>
      </div>

      {/* CHECKLIST RESULTS */}
      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Checklist Results</h2>

        {inspection.checklist ? (
          Object.entries(inspection.checklist).map(([section, items]: any) => (
            <div key={section} className="mb-4">
              <p className="font-semibold text-lg">{section}</p>
              <ul className="list-disc ml-6 text-gray-700">
                {Object.entries(items).map(([item, checked]: any) => (
                  <li key={item}>
                    {item}:{" "}
                    <span className={checked ? "text-green-600" : "text-red-600"}>
                      {checked ? "OK" : "Needs Attention"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No checklist data available.</p>
        )}
      </div>

      {/* NOTES SECTION */}
      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Notes</h2>
        <p className="text-gray-700">{inspection.notes || "No notes provided."}</p>
      </div>
    </div>
  );
}
