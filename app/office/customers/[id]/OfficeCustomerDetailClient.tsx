"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

export default function OfficeCustomerDetailClient({ params }: any) {
  const id = params.id;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/admin/customers/${id}`, {
      cache: "no-store",
    });
    const js = await res.json();
    setCustomer(js.customer || null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !customer) {
    return <div className="p-6 text-gray-500">Loading customer…</div>;
  }

  return (
    <div className="space-y-10 max-w-4xl">
      <TeslaHeroBar
        title={customer.name}
        status={customer.active ? "Active" : "Inactive"}
        meta={[
          { label: "Market", value: customer.market },
          { label: "Address", value: customer.address },
        ]}
      />

      <TeslaSection label="Customer Information">
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-500">Billing Contact: </span>
            {customer.billing_contact || "—"}
          </div>

          <div>
            <span className="text-gray-500">Approval Type: </span>
            {customer.approval_type || "AUTO"}
          </div>
        </div>
      </TeslaSection>
    </div>
  );
}
