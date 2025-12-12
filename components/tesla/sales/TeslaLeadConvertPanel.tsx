"use client";

import { useState } from "react";

export function TeslaLeadConvertPanel({ lead, onRefresh }: any) {
  const [loading, setLoading] = useState(false);

  async function convert() {
    setLoading(true);
    const res = await fetch(`/api/outside-sales/leads/${lead.id}/convert`, {
      method: "POST",
      body: JSON.stringify({
        email: lead.email,
        businessName: lead.business_name,
        market: lead.market,
      }),
    }).then((r) => r.json());

    setLoading(false);
    if (res.ok) onRefresh();
    else alert(res.error || "Conversion failed");
  }

  return (
    <div className="p-6 bg-white rounded-xl border">
      <h3 className="font-semibold text-lg mb-2">Convert Lead to Customer</h3>
      <p className="text-sm text-gray-600 mb-4">
        This will create a customer, create the login, sync everything, and
        notify the office.
      </p>

      <button
        onClick={convert}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm"
      >
        {loading ? "Converting…" : "Convert Lead"}
      </button>
    </div>
  );
}
