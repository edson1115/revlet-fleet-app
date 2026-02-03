"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { useRouter } from "next/navigation";

export default function LeadsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    const r = await fetch("/api/outside-sales/leads").then((r) => r.json());
    if (r.ok) setRows(r.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TeslaHeroBar
        title="My Leads"
        subtitle="Track prospects and conversions"
        actions={[
          {
            label: "New Lead",
            onClick: () => router.push("/outside-sales/leads/new"),
          },
        ]}
      />

      <div className="max-w-5xl mx-auto p-6">
        <TeslaSection label="All Leads">
          <div className="bg-white rounded-xl divide-y">
            {loading && <div className="p-4 text-gray-400">Loading…</div>}

            {!loading &&
              rows.map((lead) => (
                
              ))}
          </div>
        </TeslaSection>
      </div>
    </div>
  );
}
