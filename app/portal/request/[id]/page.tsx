"use client";

import { useEffect, useState } from "react";

type RequestRow = {
  id: string;
  status: string;
  created_at?: string | null;
  service?: string | null;
  notes?: string | null;
  po?: string | null;
  mileage?: number | null;
  vehicle?: any;
  customer?: any;
  location?: any;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function PortalRequestDetail({ params }: any) {
  const { id } = params;

  const [row, setRow] = useState<RequestRow | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await fetchJSON<RequestRow>(
          `/api/portal/requests/${encodeURIComponent(id)}`
        );
        if (!live) return;
        setRow(data);
      } catch (e: any) {
        setErr(e?.message || "Failed to load request");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!row) return <div className="p-6">Not found.</div>;

  // 🔧 FIX: Normalize vehicle shape
  const v = Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle ?? null;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Request #{row.id}</h1>

      {/* Customer */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Customer</h2>
        <p>{row.customer?.name || "—"}</p>
      </div>

      {/* Vehicle */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Vehicle</h2>
        {v ? (
          <>
            <p>
              {v.year} {v.make} {v.model}
            </p>
            <p>Unit: {v.unit_number}</p>
            <p>Plate: {v.plate}</p>
          </>
        ) : (
          <p>—</p>
        )}
      </div>

      {/* Details */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Details</h2>
        <p>Status: {row.status}</p>
        <p>Service: {row.service || "—"}</p>
        <p>PO: {row.po || "—"}</p>
        <p>Mileage: {row.mileage ?? "—"}</p>
        <p>Created: {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</p>
      </div>

      {/* Notes */}
      {row.notes ? (
        <div>
          <h2 className="text-lg font-semibold mb-1">Notes</h2>
          <p className="whitespace-pre-wrap">{row.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
