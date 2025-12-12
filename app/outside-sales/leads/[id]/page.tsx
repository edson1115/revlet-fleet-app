"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function LeadDetailPage({ params }: any) {
  const leadId = params.id;
  const [lead, setLead] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/outside-sales/leads/${leadId}`, {
      cache: "no-store",
    });
    const js = await res.json();
    if (js.ok) setLead(js.lead);
  }

  useEffect(() => {
    load();
  }, []);

  if (!lead) return <div className="p-6">Loading lead…</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">

      <TeslaHeroBar
        title={lead.customer_name}
        subtitle={lead.company_name}
      />

      <div className="max-w-4xl mx-auto p-6 space-y-8">

        {/* 🔥 AUTO-SYNC STATUS */}
        {lead.auto_converted && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="text-sm text-green-700 font-medium">
              ✓ This lead was automatically converted into a Revlet customer.
            </div>
            {lead.last_sync_at && (
              <div className="text-xs text-green-600 mt-1">
                Synced on:{" "}
                {new Date(lead.last_sync_at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <TeslaSection label="Lead Details">
          <div className="text-sm space-y-2">
            <div><strong>Email:</strong> {lead.customer_email || "—"}</div>
            <div><strong>Market:</strong> {lead.target_market || "—"}</div>
            <div><strong>Status:</strong> {lead.status || "New"}</div>
          </div>
        </TeslaSection>

        <TeslaSection label="Notes">
          <div className="text-sm whitespace-pre-line text-gray-700">
            {lead.notes || "No notes yet."}
          </div>
        </TeslaSection>
      </div>

    </div>
  );
}
