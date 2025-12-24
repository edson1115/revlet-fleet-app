"use client";

import { useSearchParams } from "next/navigation";
import RequestCreateForm from "@/components/requests/RequestCreateForm";

export default function OfficeNewRequestPage() {
  const params = useSearchParams();
  const customerId = params.get("customer") ?? undefined;
  const vehicleId = params.get("vehicle") ?? undefined;

  if (!customerId) {
    return <div className="p-6 text-gray-500">Missing customer context.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        Create Service Request (Office)
      </h1>

      <RequestCreateForm
        mode="office"
        customerId={customerId}
        vehicleId={vehicleId}
      />
    </div>
  );
}
