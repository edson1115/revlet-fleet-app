"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TeslaSection from "@/components/tesla/TeslaSection";
import OfficeStepHeader from "@/components/office/OfficeStepHeader";

type Customer = {
  id: string;
  name: string;
};

export default function OfficeNewRequestPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/office/customers", { cache: "no-store" });
      const js = await res.json();
      if (js.ok) setCustomers(js.customers ?? []);
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <OfficeStepHeader title="Create Service Request (Walk-In)" />

      <TeslaSection label="Select Customer">
        <div className="space-y-3">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(c.id)}
              className={`w-full p-4 text-left rounded-lg border ${
                selectedCustomer === c.id
                  ? "border-black bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </TeslaSection>

      <div className="flex justify-end mt-6">
        <button
          disabled={!selectedCustomer}
          onClick={() =>
            router.push(
              `/office/customers/new-request/vehicle?customerId=${selectedCustomer}`
            )
          }
          className={`px-5 py-2 rounded-lg ${
            selectedCustomer
              ? "bg-black text-white"
              : "bg-gray-300 text-gray-600"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
