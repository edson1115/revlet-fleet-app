"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaLeadTimeline } from "../components/TeslaLeadTimeline";
import { TeslaLeadUpdateDrawer } from "../components/TeslaLeadUpdateDrawer";
import { TeslaConvertLeadModal } from "../components/TeslaConvertLeadModal";

export default function LeadDetailPage({ params }: any) {
  const id = params.id;
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [drawer, setDrawer] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  async function load() {
    const r = await fetch(`/api/outside-sales/leads/${id}`).then((r) =>
      r.json()
    );

    if (r.ok) {
      setLead(r.lead);
      setUpdates(r.updates);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !lead)
    return <div className="p-10 text-gray-400">Loading lead…</div>;

  async function saveUpdate(text: string) {
    await fetch(`/api/outside-sales/leads/${id}/update`, {
      method: "POST",
      body: JSON.stringify({ update_text: text }),
    });

    setDrawer(false);
    load();
  }

  async function convertLead() {
    await fetch(`/api/outside-sales/leads/convert`, {
      method: "POST",
      body: JSON.stringify({ lead_id: id }),
    });

    setConvertOpen(false);
    load();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <button
        className="text-sm text-gray-500"
        onClick={() => router.push("/outside-sales/leads")}
      >
        ← Back to Leads
      </button>

      <TeslaHeroBar
        title={lead.customer_name}
        subtitle={lead.company_name}
        status={lead.status}
        actions={[
          {
            label: "Add Update",
            onClick: () => setDrawer(true),
          },
          {
            label: "Convert",
            onClick: () => setConvertOpen(true),
          },
        ]}
      />

      <TeslaSection label="Details">
        <div className="text-sm space-y-2">
          <div>
            <label className="text-gray-500">Email</label>
            <div>{lead.customer_email}</div>
          </div>

          <div>
            <label className="text-gray-500">Phone</label>
            <div>{lead.phone || "—"}</div>
          </div>

          <div>
            <label className="text-gray-500">Notes</label>
            <div>{lead.notes || "—"}</div>
          </div>

          <div>
            <label className="text-gray-500">Status</label>
            <div className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs">
              {lead.status}
            </div>
          </div>
        </div>
      </TeslaSection>

      <TeslaSection label="Timeline">
        <TeslaLeadTimeline updates={updates} />
      </TeslaSection>

      <TeslaLeadUpdateDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        onSave={saveUpdate}
      />

      <TeslaConvertLeadModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        onConvert={convertLead}
      />
    </div>
  );
}
