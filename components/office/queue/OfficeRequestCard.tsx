"use client";

import { useRouter } from "next/navigation";

export default function OfficeRequestCard({ request }: { request: any }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/office/requests/${request.id}`)}
      className="cursor-pointer rounded-xl border bg-white p-4 hover:bg-gray-50"
    >
      <div className="font-semibold text-sm">
        {request.customer?.name ?? "Unknown Customer"}
      </div>

      <div className="text-xs text-gray-500">
        {request.vehicle?.unit_number ||
          request.vehicle?.plate ||
          "Vehicle"}
      </div>

      <div className="mt-2 text-xs font-semibold">
        {request.status}
      </div>
    </div>
  );
}
