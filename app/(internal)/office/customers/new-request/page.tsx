"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TeslaSection from "@/components/tesla/TeslaSection";

type Customer = {
  id: string;
  name: string;
};

export default function OfficeNewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      const res = await fetch("/api/office/customers", {
        cache: "no-store",
        credentials: "include",
      });
      const js = await res.json();
      if (js.ok) setCustomers(js.customers ?? []);
      setLoading(false);
    }

    loadCustomers();
  }, []);

  if (loading) {
    return <div className="p-8">Loading customers…</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <h1 className="text-2xl font-semibold">
        Create Service Request (Walk-In)
      </h1>

      <p className="text-sm text-gray-600">
        Select a customer to begin a service request for a drop-off or walk-in.
      </p>

      <TeslaSection label="Select Customer">
        <div className="space-y-3">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(c.id)}
              className={`w-full text-left p-4 rounded-lg border transition ${
                selectedCustomer === c.id
                  ? "border-black bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="font-medium">{c.name}</div>
            </button>
          ))}
        </div>
      </TeslaSection>

      <div className="flex justify-end">
        <button
          disabled={!selectedCustomer}
          onClick={() =>
            router.push(
              `/office/customers/new-request/vehicle?customerId=${selectedCustomer}`
            )
          }
          className={`px-5 py-2 rounded-lg text-sm font-medium ${
            selectedCustomer
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
