"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/office/customers/${id}`, {
        cache: "no-store",
      });
      const js = await res.json();

      if (!res.ok) throw new Error(js.error || "Failed to load customer");

      setCustomer(js.customer);
      setStats(js.stats);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-sm">Loading customer…</div>
    );
  }

  if (!customer) {
    return <div className="p-6 text-red-600">Customer not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Breadcrumb */}
      <Link
        href="/office/customers"
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Back to Customers
      </Link>

      {/* HERO */}
      <TeslaHeroBar
        title={customer.name}
        status={customer.grade || "N/A"}
        meta={[
          { label: "Vehicles", value: stats?.vehicles ?? "0" },
          { label: "Open Requests", value: stats?.openRequests ?? "0" },
          { label: "Approval", value: customer.approval_type || "—" },
        ]}
      />

      {/* CUSTOMER INFO */}
      <TeslaServiceCard title="Customer Profile">
        <TeslaSection label="Details">
          <TeslaKV k="Name" v={customer.name} />
          <TeslaKV k="Address" v={customer.address || "—"} />
          <TeslaKV k="Approval Type" v={customer.approval_type || "—"} />
          <TeslaKV k="Grade" v={customer.grade || "—"} />
        </TeslaSection>

        <TeslaDivider />

        <TeslaSection label="Billing Contact">
          <TeslaKV k="Contact" v={customer.billing_contact || "—"} />
        </TeslaSection>

        <TeslaDivider />

        <TeslaSection label="Notes">
          <div className="text-sm whitespace-pre-line">
            {customer.notes || "—"}
          </div>
        </TeslaSection>
      </TeslaServiceCard>

      {/* NAVIGATION TABS */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/office/customers/${id}/vehicles`)}
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Vehicles →
        </button>

        <button
          onClick={() => router.push(`/office/customers/${id}/requests`)}
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Requests →
        </button>
      </div>
    </div>
  );
}
