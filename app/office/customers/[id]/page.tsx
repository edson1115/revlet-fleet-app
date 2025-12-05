"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Car,
  ListChecks,
  Repeat,
  HeartPulse,
  Users,
  Settings,
} from "lucide-react";

import { normalizeRole } from "@/lib/permissions";
import Lightbox from "@/components/common/Lightbox";

// PANELS (already generated previously)
import OverviewPanel from "./panels/OverviewPanel";
import VehiclesPanel from "./panels/VehiclesPanel";
import RequestsPanel from "./panels/RequestsPanel";
import RecurringPanel from "./panels/RecurringPanel";
import FleetHealthPanel from "./panels/FleetHealthPanel";
import ContactsPanel from "./panels/ContactsPanel";
import SettingsPanel from "./panels/SettingsPanel";

const INTERNAL = new Set([
  "OFFICE",
  "DISPATCH",
  "FLEET_MANAGER",
  "ADMIN",
  "SUPERADMIN",
]);

export default function CustomerManagementPage({ params }: any) {
  const router = useRouter();
  const customerId = params.id;

  // Access control
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Customer object
  const [customer, setCustomer] = useState<any>(null);

  // Active tab in Tesla left sidebar
  const [tab, setTab] = useState<
    "overview" | "vehicles" | "requests" | "recurring" | "health" | "contacts" | "settings"
  >("overview");

  // Lightbox for photos
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);

  // ------------------------------------------------------------
  // AUTH CHECK
  // ------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) throw new Error();

        const me = await r.json();
        const role = normalizeRole(me.role);

        if (role && INTERNAL.has(role)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      }
      setLoading(false);
    })();
  }, []);

  // ------------------------------------------------------------
  // LOAD CUSTOMER CORE INFORMATION
  // ------------------------------------------------------------
  useEffect(() => {
    if (!authorized) return;

    (async () => {
      const res = await fetch(`/api/portal/customers/${customerId}`);
      const json = await res.json();

      if (json.error) {
        console.error("Customer load error:", json.error);
        return;
      }

      setCustomer(json.customer);
    })();
  }, [authorized, customerId]);

  // ------------------------------------------------------------
  // ACCESS CONTROL RENDER
  // ------------------------------------------------------------
  if (loading) return <div className="p-6 text-sm">Checking access…</div>;

  if (!authorized)
    return (
      <div className="p-6 text-red-600 text-sm">
        You do not have permission to access this page.
      </div>
    );

  if (!customer) return <div className="p-6 text-sm">Loading customer…</div>;

  // ------------------------------------------------------------
  // LEFT ICON BAR (Tesla Style)
  // ------------------------------------------------------------
  const NAV = [
    { key: "overview", icon: Home, label: "Overview" },
    { key: "vehicles", icon: Car, label: "Vehicles" },
    { key: "requests", icon: ListChecks, label: "Requests" },
    { key: "recurring", icon: Repeat, label: "Recurring" },
    { key: "health", icon: HeartPulse, label: "Fleet Health" },
    { key: "contacts", icon: Users, label: "Contacts" },
    { key: "settings", icon: Settings, label: "Settings" },
  ] as const;

  // ------------------------------------------------------------
  // MAIN LAYOUT
  // ------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">

      {/* LEFT TESLA SIDEBAR */}
      <aside
        className="
          w-[72px]
          bg-white border-r border-gray-200
          flex flex-col items-center gap-4
          py-6
        "
      >
        {NAV.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              title={item.label}
              className={`
                p-3 rounded-xl transition
                hover:bg-gray-100
                ${tab === item.key ? "bg-black text-white" : "text-gray-700"}
              `}
            >
              <Icon size={22} strokeWidth={2} />
            </button>
          );
        })}
      </aside>

      {/* RIGHT CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        {tab === "overview" && (
          <OverviewPanel customerId={customerId} customer={customer} />
        )}

        {tab === "vehicles" && (
          <VehiclesPanel
            customerId={customerId}
            onOpenLightbox={(imgs, idx) => {
              setLightboxImages(imgs);
              setLightboxIndex(idx);
              setLightboxOpen(true);
            }}
          />
        )}

        {tab === "requests" && (
          <RequestsPanel
            customerId={customerId}
            onOpenLightbox={(imgs, idx) => {
              setLightboxImages(imgs);
              setLightboxIndex(idx);
              setLightboxOpen(true);
            }}
          />
        )}

        {tab === "recurring" && <RecurringPanel customerId={customerId} />}

        {tab === "health" && <FleetHealthPanel customerId={customerId} />}

        {tab === "contacts" && <ContactsPanel customerId={customerId} />}

        {tab === "settings" && <SettingsPanel customerId={customerId} />}
      </main>

      {/* PHOTO LIGHTBOX */}
      <Lightbox
        open={lightboxOpen}
        images={lightboxImages}
        index={lightboxIndex}
        onIndex={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
