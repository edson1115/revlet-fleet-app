"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaRequestCard } from "@/components/tesla/TeslaRequestCard";

type Job = {
  id: string;
  status: string;
  service?: string;
  created_at: string;

  vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    plate?: string;
    unit_number?: string;
  };
};

export default function TechQueuePage() {
  const router = useRouter();
  const [rows, setRows] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tech/queue", {
      cache: "no-store",
    });
    const js = await res.json();
    if (js.ok) setRows(js.rows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar
        title="My Jobs"
        subtitle="Your assigned service requests"
      />

      <div className="max-w-5xl mx-auto p-6 space-y-10">
        <TeslaSection>
          {loading && (
            <div className="p-6 text-gray-500">Loading…</div>
          )}

          {!loading && rows.length === 0 && (
            <div className="p-6 text-gray-500">
              No assigned jobs.
            </div>
          )}

          <div className="space-y-4">
            {rows.map((r) => {
              const v = r.vehicle;
              const title = v
                ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`
                : "Service Request";

              return (
                <TeslaRequestCard
                  key={r.id}
                  title={title}
                  subtitle={r.service || "Service"}
                  status={r.status}
                  createdAt={r.created_at}
                  onClick={() =>
                    router.push(`/tech/requests/${r.id}`)
                  }
                />
              );
            })}
          </div>
        </TeslaSection>
      </div>
    </TeslaLayoutShell>
  );
}
