// app/customer/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeRole } from "@/lib/permissions";

import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaSection } from "@/components/tesla/TeslaSection";

import RequestDrawer from "@/components/tesla/RequestDrawer";

type Vehicle = {
  id: string;
  vin: string | null;
  plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
};

type Request = {
  id: string;
  status: string;
  service: string | null;
  notes: string | null;
  created_at: string | null;

  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;

  started_at?: string | null;
  completed_at?: string | null;

  assigned_tech?: {
    id: string;
    full_name: string | null;
  } | null;

  vehicle?: Vehicle | null;

  images?: Array<{
    id: string;
    url_work: string;
    type: string | null;
  }>;
};

export default function CustomerPortalPage() {
  const router = useRouter();

  // Role + access
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);

  // Drawer Selection
  const [selected, setSelected] = useState<Request | null>(null);

  // -------------------------------------------------------
  // 1. AUTH CHECK
  // -------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) throw new Error();

        const js = await r.json();
        const role = normalizeRole(js?.role);

        // CUSTOMER + INTERNAL ROLES CAN SEE PORTAL
        if (
          role === "CUSTOMER" ||
          ["OFFICE", "ADMIN", "DISPATCH", "SUPERADMIN", "FLEET_MANAGER"].includes(
            role || ""
          )
        ) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (err) {
        setAuthorized(false);
      }
      setLoading(false);
    })();
  }, []);

  // -------------------------------------------------------
  // 2. LOAD VEHICLES + REQUESTS
  // -------------------------------------------------------
  useEffect(() => {
    if (!authorized) return;

    (async () => {
      try {
        const v = await fetch("/api/vehicles?scope=customer", {
          cache: "no-store",
        }).then((r) => r.json());

        const req = await fetch("/api/requests?scope=customer", {
          cache: "no-store",
        }).then((r) => r.json());

        setVehicles(v.rows || []);
        setRequests(req.rows || []);
      } catch (err) {
        console.error("Failed loading customer data", err);
      }
    })();
  }, [authorized]);

  if (loading) {
    return <div className="p-6 text-gray-600 text-sm">Checking access…</div>;
  }

  if (!authorized) {
    return (
      <div className="p-6 text-red-600 text-sm">
        You do not have permission to view this page.
      </div>
    );
  }

  // Split open vs closed requests
  const openRequests = requests.filter(
    (r) => r.status !== "COMPLETED" && r.status !== "DECLINED"
  );
  const closedRequests = requests.filter(
    (r) => r.status === "COMPLETED" || r.status === "DECLINED"
  );

  // -------------------------------------------------------
  // RENDER CUSTOMER PORTAL
  // -------------------------------------------------------
  return (
    <div className="p-6 space-y-10 max-w-3xl mx-auto text-black">

      {/* -------------------------------------------- */}
      {/* PROFILE HEADER */}
      {/* -------------------------------------------- */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">
          Welcome
        </h1>

        <p className="text-gray-600 text-sm mt-1">
          {vehicles.length} Vehicles • {openRequests.length} Open Requests
        </p>

        <TeslaDivider className="mt-4" />
      </div>

      {/* -------------------------------------------- */}
      {/* VEHICLES LIST */}
      {/* -------------------------------------------- */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Vehicles</h2>

        {vehicles.length === 0 && (
          <div className="text-gray-500 text-sm">No vehicles found.</div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200">
          {vehicles.map((v) => (
            <TeslaListRow
              key={v.id}
              title={`${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim()}
              subtitle={v.plate || v.vin || ""}
              rightIcon={false}
            />
          ))}
        </div>
      </div>

      {/* -------------------------------------------- */}
      {/* CREATE SERVICE REQUEST BUTTON */}
      {/* -------------------------------------------- */}
      <button
        onClick={() => router.push("/customer/create")}
        className="
          w-full py-4 rounded-xl bg-black text-white 
          text-base font-medium tracking-tight
          hover:bg-gray-900 transition
        "
      >
        Create Service Request
      </button>

      {/* -------------------------------------------- */}
      {/* OPEN REQUESTS */}
      {/* -------------------------------------------- */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Open Requests</h2>

        {openRequests.length === 0 && (
          <div className="text-gray-500 text-sm">No open requests.</div>
        )}

        <div className="rounded-xl overflow-hidden border border-gray-200">
          {openRequests.map((r) => {
            const title = r.vehicle
              ? `${r.vehicle.year || ""} ${r.vehicle.make || ""} ${
                  r.vehicle.model || ""
                }`
              : "Vehicle";

            const subtitle = r.service || "Requested Service";
            const meta = r.vehicle?.plate || r.vehicle?.vin || "";

            return (
              <TeslaListRow
                key={r.id}
                title={title.trim()}
                subtitle={subtitle}
                metaLeft={meta}
                status={r.status}
                onClick={() => setSelected(r)}
              />
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------- */}
      {/* CLOSED REQUESTS */}
      {/* -------------------------------------------- */}
      <div>
        <h2 className="text-lg font-semibold mt-10 mb-3">Past Requests</h2>

        {closedRequests.length === 0 && (
          <div className="text-gray-500 text-sm">No past requests.</div>
        )}

        <div className="rounded-xl overflow-hidden border border-gray-200">
          {closedRequests.map((r) => {
            const title = r.vehicle
              ? `${r.vehicle.year || ""} ${r.vehicle.make || ""} ${
                  r.vehicle.model || ""
                }`
              : "Vehicle";

            const subtitle = r.service || "Service";
            const meta = r.vehicle?.plate || r.vehicle?.vin || "";

            return (
              <TeslaListRow
                key={r.id}
                title={title.trim()}
                subtitle={subtitle}
                metaLeft={meta}
                status={r.status}
                onClick={() => setSelected(r)}
              />
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------- */}
      {/* REQUEST DRAWER */}
      {/* -------------------------------------------- */}
      {selected && (
        <RequestDrawer request={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}



