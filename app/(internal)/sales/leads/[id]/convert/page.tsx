"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function ConvertLeadPage({ params }: any) {
  const leadId = params.id;
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [market, setMarket] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const r = await fetch(`/api/outside-sales/leads/${leadId}`).then(r => r.json());
    if (r.ok) {
      setLead(r.lead);
      setEmail(r.lead.customer_email || "");
      setBusinessName(r.lead.business_name || "");
      setMarket(r.lead.market || "");
    }
    setLoading(false);
  }

  const convert = async () => {
    setSending(true);

    const r = await fetch(`/api/outside-sales/leads/${leadId}/convert`, {
      method: "POST",
      body: JSON.stringify({ email, businessName, market }),
    }).then(r => r.json());

    setSending(false);

    if (r.ok) {
      router.push(`/sales/leads/${leadId}`);
    } else {
      alert(r.error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !lead) return <div className="p-10">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <TeslaHeroBar
        title="Convert Lead → Customer"
        status="CONVERSION"
      />

      <TeslaSection label="Customer Information">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Business Name</label>
            <input className="w-full border p-2 rounded"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Customer Email</label>
            <input className="w-full border p-2 rounded"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Market</label>
            <input className="w-full border p-2 rounded"
              value={market}
              onChange={e => setMarket(e.target.value)}
            />
          </div>

          <button
            onClick={convert}
            disabled={sending}
            className="px-5 py-2 bg-black text-white rounded-lg"
          >
            {sending ? "Converting…" : "Convert Lead"}
          </button>
        </div>
      </TeslaSection>
    </div>
  );
}
