"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function SettingsPanel({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/portal/customer/${customerId}`)
      .then((r) => r.json())
      .then((d) => setCustomer(d.customer));
  }, [customerId]);

  if (!customer) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <TeslaSection label="General">
        <div className="text-sm">
          Customer ID: <span className="font-mono">{customerId}</span>
        </div>
        <div className="text-sm">
          Approval Type:{" "}
          <span className="font-medium text-indigo-600">
            {customer.approval_type}
          </span>
        </div>
      </TeslaSection>
    </div>
  );
}
