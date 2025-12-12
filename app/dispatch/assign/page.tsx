"use client";

import { useEffect, useState } from "react";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaTechAvailability } from "@/components/tesla/TeslaTechAvailability";
import { useRouter } from "next/navigation";

export default function DispatchAssignPage({ searchParams }: any) {
  const requestId = searchParams?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  async function load() {
    setLoading(true);

    // Load request details
    const req = await fetch(`/api/requests/${requestId}`, {
      cache: "no-store",
    }).then((r) => r.json());

    setRequest(req.row || null);

    // Load tech list
    const t = await fetch("/api/techs?active=1", {
      cache: "no-store",
    }).then((r) => r.json());

    setTechs(t.rows || []);

    // Load availability stats
    const s = await fetch("/api/dispatch/tech-stats", {
      cache: "no-store",
    }).then((r) => r.json());

    setStats(s || {});
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function assignTech(techId: string) {
    await fetch(`/api/dispatch/assign`, {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, tech_id: techId }),
    });

    router.push(`/dispatch/requests/${requestId}`);
  }

  if (!requestId) {
    return (
      <div className="p-10 text-center text-gray-500">
        Missing request ID.
      </div>
    );
  }

  if (loading || !request || !stats) {
    return (
      <TeslaLayoutShell>
        <div className="p-10 text-gray-500">Loading…</div>
      </TeslaLayoutShell>
    );
  }

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title={`Assign Technician`}
        subtitle={`${request.vehicle?.year} ${request.vehicle?.make} ${request.vehicle?.model} — ${request.vehicle?.plate}`}
        status={request.status}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-10">
        
        {/* TECH AVAILABILITY BAR (from Drop 19) */}
        <TeslaTechAvailability techs={stats.techs} />

        <TeslaSection label="Select a Technician">
          <div className="bg-white rounded-xl divide-y">

            {techs.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                No technicians found.
              </div>
            )}

            {techs.map((tech) => (
              <TeslaListRow
                key={tech.id}
                title={tech.full_name || "Unnamed Tech"}
                subtitle={`Active • ${tech.role}`}
                right={
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
                    Assign
                  </span>
                }
                onClick={() => assignTech(tech.id)}
              />
            ))}

          </div>
        </TeslaSection>
      </div>
    </TeslaLayoutShell>
  );
}
