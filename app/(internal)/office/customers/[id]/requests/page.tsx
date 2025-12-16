"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

export default function CustomerRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/office/customers/${id}/requests`, {
        cache: "no-store",
      });

      const js = await res.json();

      if (res.ok) {
        setRequests(js.requests || []);
      }
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Breadcrumb */}
      <Link
        href={`/office/customers/${id}`}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Back to Customer
      </Link>

      <h1 className="text-[26px] font-semibold tracking-tight mt-3 mb-2">
        Service Requests
      </h1>

      <p className="text-gray-600 text-sm mb-6">
        All requests submitted by this customer
      </p>

      <TeslaDivider className="mb-6" />

      {/* LIST */}
      <div className="bg-white rounded-2xl border overflow-hidden">

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No requests found.</div>
        ) : (
          requests.map((r) => (
            <TeslaListRow
              key={r.id}
              title={r.service || "General Service"}
              subtitle={
                r.vehicle
                  ? `${r.vehicle.year ?? ""} ${r.vehicle.make ?? ""} ${
                      r.vehicle.model ?? ""
                    } • Unit #${r.vehicle.unit_number || "—"}`
                  : "No vehicle info"
              }
              metaLeft={
                <div className="flex items-center gap-2">
                  <TeslaStatusChip status={r.status} size="sm" />
                </div>
              }
              rightIcon
              onClick={() => router.push(`/office/requests/${r.id}`)}
            />
          ))
        )}

      </div>
    </div>
  );
}
