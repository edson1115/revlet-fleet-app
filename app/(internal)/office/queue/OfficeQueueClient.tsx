"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OfficeRequest = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  customer_name: string | null;
  vehicle_label: string | null;
  po_number: string | null;
};

export default function OfficeQueueClient() {
  const [rows, setRows] = useState<OfficeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/office/requests", {
          cache: "no-store",
          credentials: "include",
        });

        const js = await res.json();

        if (js.ok && Array.isArray(js.rows)) {
          // QUEUE = NEW + WAITING ONLY
          const filtered = js.rows.filter(
            (r: OfficeRequest) =>
              r.status === "NEW" || r.status === "WAITING"
          );

          setRows(filtered);
        }
      } catch (e) {
        console.error("Office Queue load failed:", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading queue…</div>;
  }

  if (!rows.length) {
    return (
      <div className="p-6 text-sm text-gray-500">
        🎉 Queue is empty. No pending work.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Office Queue
      </h1>

      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/office/requests/${r.id}`}
          className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-black transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">
                {r.type.replace("_", " ")}
              </div>

              <div className="text-sm text-gray-500">
                {r.customer_name ?? "Unknown customer"}
              </div>

              {r.vehicle_label && (
                <div className="text-sm text-gray-400">
                  {r.vehicle_label}
                </div>
              )}

              {r.po_number === null && (
                <div className="text-xs text-red-600 mt-1">
                  PO: MISSING
                </div>
              )}
            </div>

            <span className="rounded-full border px-2 py-0.5 text-xs">
              {r.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
