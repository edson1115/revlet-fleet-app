"use client";

import { useEffect, useState } from "react";
import OverviewPanel from "./OverviewPanel";
import VehiclesPanel from "./VehiclesPanel";
import RequestsPanel from "./RequestsPanel";
import FleetHealthPanel from "./FleetHealthPanel";
import ContactsPanel from "./ContactsPanel";
import SettingsPanel from "./SettingsPanel";

import {
  Home,
  Car,
  ListChecks,
  HeartPulse,
  Users,
  Settings,
} from "lucide-react";

export default function CustomerDashboard({ params }: any) {
  const id = params.id;

  const [customer, setCustomer] = useState<any>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch(`/api/portal/customer/${id}`)
      .then((r) => r.json())
      .then((d) => setCustomer(d.customer));
  }, [id]);

  if (!customer) return <div className="p-6">Loading…</div>;

  const TABS = [
    { key: "overview", icon: Home },
    { key: "vehicles", icon: Car },
    { key: "requests", icon: ListChecks },
    { key: "health", icon: HeartPulse },
    { key: "contacts", icon: Users },
    { key: "settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">

      {/* SIDEBAR */}
      <aside className="w-[72px] bg-white border-r p-6 flex flex-col gap-6 items-center">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`p-3 rounded-xl ${
                tab === t.key ? "bg-black text-white" : "hover:bg-gray-100"
              }`}
            >
              <Icon size={22} strokeWidth={2} />
            </button>
          );
        })}
      </aside>

      {/* MAIN PANEL */}
      <main className="flex-1 p-8">
        {tab === "overview" && (
          <OverviewPanel customer={customer} customerId={id} />
        )}
        {tab === "vehicles" && (
          <VehiclesPanel customerId={id} />
        )}
        {tab === "requests" && (
          <RequestsPanel customerId={id} />
        )}
        {tab === "health" && (
          <FleetHealthPanel customerId={id} />
        )}
        {tab === "contacts" && (
          <ContactsPanel customerId={id} />
        )}
        {tab === "settings" && (
          <SettingsPanel customerId={id} />
        )}
      </main>
    </div>
  );
}
