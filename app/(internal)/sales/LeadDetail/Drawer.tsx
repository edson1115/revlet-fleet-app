"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import Timeline from "./Timeline";
import VisitUpload from "./VisitUpload";
import ConvertLead from "./ConvertLead";

export default function Drawer({ id, onClose }: any) {
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/sales/leads/${id}`);
      const j = await r.json();
      setLead(j.lead);
    }
    load();
  }, [id]);

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
      <div className="w-full sm:w-[420px] bg-white h-full overflow-y-auto p-6 space-y-8">
        <Header lead={lead} onClose={onClose} />

        <Timeline leadId={id} />

        <VisitUpload leadId={id} />

        <ConvertLead lead={lead} />
      </div>
    </div>
  );
}
