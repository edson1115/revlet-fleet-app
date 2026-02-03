"use client";

import { useEffect, useState } from "react";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import RequestDrawer from "../drawers/RequestDrawer"; // 🔥 IMPORTANT — points to your RequestDrawer
import {
  Filter,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

// ------------------------------
// TYPES
// ------------------------------
type Request = {
  id: string;
  status: string;
  service: string | null;
  notes: string | null;
  date_requested: string | null;
  created_at: string | null;

  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;

  vehicle?: {
    id: string;
    year: number | null;
    make: string | null;
    model: string | null;
    plate: string | null;
    vin: string | null;
  } | null;

  assigned_tech?: {
    id: string;
    full_name: string | null;
  } | null;
};

// Status colors Tesla-style
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-gray-400",
  WAITING_TO_BE_SCHEDULED: "bg-amber-500",
  SCHEDULED: "bg-blue-500",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-500",
};

export default function RequestsPanel({
  customerId,
  onOpenLightbox,
}: {
  customerId: string;
  onOpenLightbox: (imgs: any[], index: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filtered, setFiltered] = useState<Request[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<any[]>([]);

  // Drawer
  const [drawer, setDrawer] = useState<{
    open: boolean;
    request: Request | null;
  }>({
    open: false,
    request: null,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");

  // --------------------------------------------------------
  // LOAD REQUESTS
  // --------------------------------------------------------
  async function load() {
    setLoading(true);

    const res = await fetch(
      `/api/portal/customers/${customerId}/requests`,
      { cache: "no-store" }
    );
    const json = await res.json();

    setRequests(json?.requests || []);
    setFiltered(json?.requests || []);
    setLoading(false);
  }

  // Load vehicles for filter
  async function loadVehicles() {
    const res = await fetch(
      `/api/portal/customers/${customerId}/vehicles`,
      { cache: "no-store" }
    );
    const json = await res.json();
    setVehicleOptions(json?.vehicles || []);
  }

  useEffect(() => {
    load();
    loadVehicles();
  }, [customerId]);

  // --------------------------------------------------------
  // FILTER LOGIC
  // --------------------------------------------------------
  useEffect(() => {
    let list = [...requests];

    // Search
    if (searchTerm.trim() !== "") {
      const t = searchTerm.toLowerCase();
      list = list.filter((r) =>
        [
          r.id,
          r.service,
          r.vehicle?.make,
          r.vehicle?.model,
          r.vehicle?.plate,
          r.vehicle?.vin,
          r.status,
        ]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(t))
      );
    }

    // Status
    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Vehicle
    if (vehicleFilter !== "ALL") {
      list = list.filter((r) => r.vehicle_id === vehicleFilter);
    }

    setFiltered(list);
  }, [searchTerm, statusFilter, vehicleFilter, requests]);

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Service Requests
        </h2>

        <button
          onClick={load}
          className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <TeslaDivider />

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="flex items-center bg-[#F5F5F5] px-3 py-2 rounded-lg">
          <Search size={16} className="text-gray-500 mr-2" />
          <input
            placeholder="Search requests…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm w-full outline-none"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#F5F5F5] px-3 py-2 rounded-lg text-sm"
        >
          <option value="ALL">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        {/* Vehicle filter */}
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="bg-[#F5F5F5] px-3 py-2 rounded-lg text-sm"
        >
          <option value="ALL">All Vehicles</option>
          {vehicleOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {`${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim()} —{" "}
              {v.plate || v.vin}
            </option>
          ))}
        </select>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading && (
          <p className="text-gray-500 text-sm">Loading requests…</p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-gray-500 text-sm">No requests found.</p>
        )}

        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => setDrawer({ open: true, request: r })}
            className="
              w-full text-left p-4 bg-white rounded-xl border
              hover:shadow-md transition flex flex-col gap-1
            "
          >
            {/* TITLE */}
            <div className="flex justify-between items-center">
              <div className="font-medium text-[15px]">
                {r.vehicle
                  ? `${r.vehicle.year || ""} ${r.vehicle.make || ""} ${
                      r.vehicle.model || ""
                    }`.trim()
                  : "Vehicle"}
              </div>

              <div
                className={`px-2 py-1 text-xs rounded-lg font-semibold text-white ${
                  STATUS_COLORS[r.status] || "bg-gray-400"
                }`}
              >
                {r.status.replace(/_/g, " ")}
              </div>
            </div>

            {/* META */}
            <div className="text-xs text-gray-500 flex justify-between">
              <span>
                {r.vehicle?.plate || r.vehicle?.vin || "—"}
              </span>
              <span>
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : ""}
              </span>
            </div>

            {/* SERVICE */}
            <div className="text-sm text-gray-700 mt-1">
              {r.service || "—"}
            </div>
          </button>
        ))}
      </div>

      {/* DRAWER */}
      {drawer.open && drawer.request && (
        <RequestDrawer
          open={drawer.open}
          request={drawer.request}
          onClose={() => setDrawer({ open: false, request: null })}
          onPhotos={onOpenLightbox}
        />
      )}
    </div>
  );
}
