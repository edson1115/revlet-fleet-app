"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

type Market = {
  id: string;
  name: string;
  market: string;
};

export default function AddCustomerPage() {
  const router = useRouter();

  // user role + market
  const [role, setRole] = useState<string | null>(null);
  const [userMarket, setUserMarket] = useState<string>("San Antonio");

  // markets
  const [markets, setMarkets] = useState<Market[]>([]);

  // form fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [approvalType, setApprovalType] = useState("AUTO");
  const [billingContact, setBillingContact] = useState("");

  // selected market
  const [market, setMarket] = useState<string>("San Antonio");

  // UI
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ------------------------------------------
  // LOAD USER + MARKETS
  // ------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const js = await r.json();

        const roleNormalized = normalizeRole(js?.role);
        setRole(roleNormalized);

        const usrMarket = js?.market || "San Antonio";
        setUserMarket(usrMarket);
        setMarket(usrMarket); // default for Office

        // load markets list
        const lookup = await fetch("/api/lookups?scope=markets");
        const m = await lookup.json();
        setMarkets(m?.markets || []);
      } catch (e) {
        console.error(e);
      }
    }

    load();
  }, []);

  // ------------------------------------------
  // SUBMIT FORM
  // ------------------------------------------
  async function submit() {
    setSaving(true);
    setErr(null);

    try {
      const body = {
        name,
        address: address || null,
        approval_type: approvalType,
        billing_contact: billingContact || null,
        market_id: market, // IMPORTANT
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const js = await res.json();

      if (!res.ok) {
        throw new Error(js?.error || "Failed to create customer");
      }

      router.push("/office/customers");
    } catch (e: any) {
      setErr(e?.message || "Error saving customer");
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------
  // UI
  // ------------------------------------------
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-[28px] font-semibold tracking-tight">
        Add Customer
      </h1>

      <p className="text-gray-600 text-sm mb-4">
        Create a new customer account for your fleet operations.
      </p>

      <TeslaDivider />

      <TeslaServiceCard title="Customer Information">
        <TeslaSection label="Name">
          <input
            className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer Name"
          />
        </TeslaSection>

        <TeslaSection label="Address">
          <input
            className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
          />
        </TeslaSection>

        <TeslaSection label="Billing Contact">
          <input
            className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
            value={billingContact}
            onChange={(e) => setBillingContact(e.target.value)}
            placeholder="billing@example.com"
          />
        </TeslaSection>

        <TeslaSection label="Approval Type">
          <select
            className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
            value={approvalType}
            onChange={(e) => setApprovalType(e.target.value)}
          >
            <option value="AUTO">AUTO</option>
            <option value="MANUAL">MANUAL</option>
            <option value="NONE">NONE</option>
          </select>
        </TeslaSection>

        {/* MARKET SECTION */}
        {(role === "ADMIN" || role === "SUPERADMIN") && (
          <TeslaSection label="Market">
            <select
              className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            >
              {markets.map((m) => (
                <option key={m.id} value={m.market}>
                  {m.market}
                </option>
              ))}
            </select>
          </TeslaSection>
        )}

        {/* OFFICE → LOCKED MARKET */}
        {role === "OFFICE" && (
          <TeslaSection label="Market">
            <input
              disabled
              className="w-full bg-gray-100 text-gray-500 rounded-lg px-3 py-2"
              value={market}
            />
          </TeslaSection>
        )}

        {/* ERROR */}
        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        {/* ACTION BUTTON */}
        <div className="pt-4">
          <button
            disabled={saving || !name}
            onClick={submit}
            className="
              w-full bg-black text-white py-3 rounded-lg 
              font-semibold text-sm hover:bg-gray-800
              disabled:opacity-40
            "
          >
            {saving ? "Saving…" : "Create Customer"}
          </button>
        </div>
      </TeslaServiceCard>
    </div>
  );
}



