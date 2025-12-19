"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OfficeCreateRequestConfirm() {
  const router = useRouter();
  const params = useSearchParams();

  const customerId = params.get("customerId");
  const vehicleId = params.get("vehicleId");

  useEffect(() => {
    if (!customerId || !vehicleId) return;

    async function create() {
      const res = await fetch("/api/office/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer_id: customerId,
          vehicle_id: vehicleId,
        }),
      });

      const js = await res.json();

      if (!res.ok || !js.request_id) {
        alert(js.error || "Failed to create request");
        router.push("/office");
        return;
      }

      router.replace(`/office/requests/${js.request_id}`);
    }

    create();
  }, [customerId, vehicleId, router]);

  return (
    <div className="p-12 text-center text-gray-600">
      Creating service request…
    </div>
  );
}
