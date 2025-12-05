// app/office/customers/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

type Customer = {
  id: string;
  name: string;
  address?: string | null;
  approval_type?: string | null;
  billing_contact?: string | null;
  fleet?: {
    totalVehicles: number;
    openRequests: number;
    grade: string;
  };
};

export default function OfficeCustomersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);

  const [search, setSearch] = useState("");

  // ---------------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const js = await r.json();

        const role = normalizeRole(js?.role);
        if (
          role &&
          ["OFFICE", "ADMIN", "SUPERADMIN", "DISPATCH", "FLEET_MANAGER"].includes(
            role
          )
        ) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      }
      setLoading(false);
    })();
  }, []);

  // ---------------------------------------------------------
  // LOAD CUSTOMER LIST
  // ---------------------------------------------------------
  useEffect(() => {
    if (!authorized) return;

    (async () => {
      try {
        const res = await fetch("/api/portal/customers/list", {
          cache: "no-store",
        });
        const js = await res.json();

        setCustomers(js.customers || []);
        setFiltered(js.customers || []);
      } catch (err) {
        console.error("Failed loading customers:", err);
      }
    })();
  }, [authorized]);

  // ---------------------------------------------------------
  // SEARCH FILTER
  // ---------------------------------------------------------
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(customers);
      return;
    }

    const term = search.toLowerCase();
    setFiltered(
      customers.filter((c) =>
        c.name.toLowerCase().includes(term)
      )
    );
  }, [search, customers]);

  // ---------------------------------------------------------
  // ACCESS CONTROL UI
  // ---------------------------------------------------------
  if (loading) {
    return <div className="p-6 text-gray-600 text-sm">Checking access…</div>;
  }

  if (!authorized) {
    return (
      <div className="p-6 text-red-600 text-sm">
        You do not have permission to view this page.
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-[28px] font-semibold tracking-tight mb-1">
        Customers
      </h1>
      <p className="text-gray-600 text-sm mb-6">
        View and manage customer accounts
      </p>

      <TeslaDivider className="mb-6" />

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full bg-[#F5F5F5] rounded-xl px-4 py-3 
            text-sm border border-transparent focus:border-black
            transition
          "
        />
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {filtered.map((c) => (
          <TeslaListRow
            key={c.id}
            title={c.name}
            subtitle={c.address || "No address on file"}
            metaLeft={`Vehicles: ${c.fleet?.totalVehicles ?? "0"}   |   Open: ${c.fleet?.openRequests ?? "0"}   |   Grade: ${c.fleet?.grade ?? "N/A"}`}
            rightIcon={true}
            onClick={() => router.push(`/customer/${c.id}`)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">No customers found.</div>
        )}
      </div>

    </div>
  );
}



