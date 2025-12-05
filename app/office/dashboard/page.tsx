"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";

export default function OfficeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [today, setToday] = useState<any>(null);
  const [techs, setTechs] = useState<any[]>([]);
  const [customers, setCustomers] = useState(0);
  const [vehicles, setVehicles] = useState(0);

  const load = async () => {
    try {
      const res = await fetch("/api/office/dashboard", { cache: "no-store" });
      const js = await res.json();

      if (!res.ok) throw new Error(js.error || "Failed loading dashboard");

      setToday(js.today);
      setTechs(js.techs);
      setCustomers(js.customers);
      setVehicles(js.vehicles);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    load();
  }, []);

  // ---------------------------------------------------
  // REALTIME SUBSCRIPTION
  // ---------------------------------------------------
  useEffect(() => {
    const supabase = supabaseBrowser();

    const channel = supabase
      .channel("office_dashboard_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        () => {
          // Reload dashboard on ANY service change
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-sm">Loading dashboard…</div>
    );
  }

  if (err) {
    return (
      <div className="p-6 text-red-600 text-sm">
        Dashboard could not load: {err}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-1">
          Office Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          Real-time activity for your fleet center
        </p>
      </div>

      {/* TODAY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TeslaServiceCard title="Total Requests">
          <div className="text-3xl font-semibold">{today.total_requests}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="New Today">
          <div className="text-3xl font-semibold">{today.new_today}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="In Progress">
          <div className="text-3xl font-semibold">{today.in_progress}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="Completed Today">
          <div className="text-3xl font-semibold">{today.completed_today}</div>
        </TeslaServiceCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TeslaServiceCard title="Waiting Approval">
          <div className="text-3xl font-semibold">{today.waiting_approval}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="Waiting Parts">
          <div className="text-3xl font-semibold">{today.waiting_parts}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="Customers">
          <div className="text-3xl font-semibold">{customers}</div>
        </TeslaServiceCard>
        <TeslaServiceCard title="Vehicles">
          <div className="text-3xl font-semibold">{vehicles}</div>
        </TeslaServiceCard>
      </div>

      <TeslaDivider />

      {/* TECH STATUS */}
      <TeslaServiceCard title="Technician Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {techs.map((t) => (
            <div
              key={t.id}
              className="border rounded-xl p-4 bg-[#FAFAFA] flex flex-col"
            >
              <div className="text-lg font-semibold">
                {t.full_name || "Unnamed Tech"}
              </div>
              <div className="mt-1 text-sm text-gray-500">Status</div>
              <div
                className={`text-base font-medium ${
                  t.tech_status === "IN_PROGRESS"
                    ? "text-green-600"
                    : t.tech_status === "SCHEDULED"
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {t.tech_status}
              </div>
            </div>
          ))}
        </div>
      </TeslaServiceCard>

      {/* LINKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeslaServiceCard title="Go to Office Queue">
          <Link
            href="/office/queue"
            className="block mt-3 text-blue-600 underline text-sm"
          >
            View All Requests →
          </Link>
        </TeslaServiceCard>
        <TeslaServiceCard title="Customers">
          <Link
            href="/office/customers"
            className="block mt-3 text-blue-600 underline text-sm"
          >
            View Customer List →
          </Link>
        </TeslaServiceCard>
      </div>
    </div>
  );
}



