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

import Lightbox from "@/components/common/Lightbox";
import { normalizeRole } from "@/lib/permissions";

// PANELS
import OverviewPanel from "./panels/OverviewPanel";
import VehiclesPanel from "./panels/VehiclesPanel";
import RequestsPanel from "./panels/RequestsPanel";
import RecurringPanel from "./panels/RecurringPanel";
import FleetHealthPanel from "./panels/FleetHealthPanel";
import ContactsPanel from "./panels/ContactsPanel";
import SettingsPanel from "./panels/SettingsPanel";

// INTERNAL ROLES ALLOWED
const INTERNAL_ROLES = new Set([
  "OFFICE",
  "DISPATCH",
  "ADMIN",
  "SUPERADMIN",
  "FLEET_MANAGER",
]);

export default function CustomerManagementPage({ params }: any) {
  const customerId = params.id;
  const router = useRouter();

  // Access control
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Customer object
  const [customer, setCustomer] = useState<any>(null);

  // Sidebar navigation
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "vehicles"
    | "requests"
    | "recurring"
    | "health"
    | "contacts"
    | "settings"
  >("overview");

  // Lightbox state (shared for all panels)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ----------------------------------------------------
  // AUTH CHECK
  // ----------------------------------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) throw new Error();

        const js = await r.json();
        const role = normalizeRole(js?.role);

        if (mounted) {
          setAuthorized(role != null && INTERNAL_ROLES.has(role));
        }
      } catch (err) {
        if (mounted) setAuthorized(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ----------------------------------------------------
  // CUSTOMER DATA LOAD
  // ----------------------------------------------------
  useEffect(() => {
    if (!authorized) return;

    let mounted = true;

    (async () => {
      try {
        const r = await fetch(`/api/portal/customer/${customerId}`, {
          cache: "no-store",
        });
        const js = await r.json();

        if (mounted) setCustomer(js.customer || null);
      } catch (err) {
        console.error("Failed loading customer", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authorized, customerId]);

  // ----------------------------------------------------
  // ACCESS CONTROL UI
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">Checking access…</div>
    );
  }

  if (!authorized) {
    return (
      <div className="p-6 text-red-600 text-sm">
        You do not have permission to access this page.
      </div>
    );
  }

  if (!customer) {
    return <div className="p-6 text-sm">Loading customer…</div>;
  }

  // ----------------------------------------------------
  // SIDEBAR ICON DEFINITIONS
  // ----------------------------------------------------
  const NAV_ITEMS = [
    { key: "overview", icon: Home, label: "Overview" },
    { key: "vehicles", icon: Car, label: "Vehicles" },
    { key: "requests", icon: ListChecks, label: "Requests" },
    { key: "recurring", icon: Repeat, label: "Recurring" },
    { key: "health", icon: HeartPulse, label: "Fleet Health" },
    { key: "contacts", icon: Users, label: "Contacts" },
    { key: "settings", icon: Settings, label: "Settings" },
  ] as const;

  // ----------------------------------------------------
  // MAIN LAYOUT (TESLA STYLE)
  // ----------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">

      {/* --------------------------------------------------
          LEFT TESLA SIDEBAR (ICON ONLY)
      -------------------------------------------------- */}
      <aside
        className="
          w-[72px]
          flex flex-col
          bg-white
          border-r border-gray-200
          py-6 space-y-6
          items-center
          text-gray-700
        "
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              title={item.label}
              className={`
                p-3 rounded-xl transition
                hover:bg-gray-100
                ${isActive ? "bg-black text-white hover:bg-black" : ""}
              `}
            >
              <Icon size={22} strokeWidth={2} />
            </button>
          );
        })}
      </aside>

      {/* --------------------------------------------------
          RIGHT PANEL — DYNAMIC CONTENT
      -------------------------------------------------- */}
      <main className="flex-1 p-8 overflow-y-auto">

        {activeTab === "overview" && (
          <OverviewPanel
            customer={customer}
            customerId={customerId}
            onOpenLightbox={(imgs, index) => {
              setLightboxImages(imgs);
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          />
        )}

        {activeTab === "vehicles" && (
          <VehiclesPanel
            customer={customer}
            customerId={customerId}
            onOpenLightbox={(imgs, index) => {
              setLightboxImages(imgs);
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          />
        )}

        {activeTab === "requests" && (
          <RequestsPanel
            customer={customer}
            customerId={customerId}
            onOpenLightbox={(imgs, index) => {
              setLightboxImages(imgs);
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          />
        )}

        {activeTab === "recurring" && (
          <RecurringPanel customerId={customerId} />
        )}

        {activeTab === "health" && (
          <FleetHealthPanel customerId={customerId} />
        )}

        {activeTab === "contacts" && (
          <ContactsPanel customerId={customerId} />
        )}

        {activeTab === "settings" && (
          <SettingsPanel customerId={customerId} />
        )}
      </main>

      {/* --------------------------------------------------
          GLOBAL LIGHTBOX FOR ALL PANELS
      -------------------------------------------------- */}
      <Lightbox
        open={lightboxOpen}
        images={lightboxImages}
        index={lightboxIndex}
        onIndex={(i) => setLightboxIndex(i)}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
