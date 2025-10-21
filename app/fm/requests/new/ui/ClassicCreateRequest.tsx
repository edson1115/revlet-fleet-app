// app/fm/requests/new/ui/ClassicCreateRequest.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Id = string;
type Market   = { id: Id; name: string };
type Customer = { id: Id; name: string; market: string | null };
type Vehicle  = {
  id: Id;
  company_id?: Id | null;
  customer_id?: Id | null;
  unit_number?: string | null;
  plate?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
};
type FmcItem  = { id: string; label: string };

// helpers
function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && Array.isArray((v as any).rows)) return (v as any).rows as T[];
  return [];
}
async function getJSON(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  try { return await r.json(); } catch { return []; }
}
function vehicleLabel(v: Vehicle) {
  const left = v.unit_number || v.plate || "";
  const right = [v.year ?? "", v.make ?? "", v.model ?? ""].filter(Boolean).join(" ").trim();
  return (left ? `${left} — ` : "") + (right || "(no details)");
}

export default function ClassicCreateRequest() {
  // data
  const [markets, setMarkets] = useState<Market[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fmc, setFmc] = useState<FmcItem[]>([]);

  // selections
  const [marketId, setMarketId] = useState<Id | "">("");
  const [customerId, setCustomerId] = useState<Id | "">("");
  const [vehicleId, setVehicleId] = useState<Id | "">("");
  const [fmcId, setFmcId] = useState<string | "">("");

  // request meta
  const [po, setPo] = useState("");
  const [notes, setNotes] = useState("");

  // loading states
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingFmc, setLoadingFmc] = useState(false);

  // add-vehicle inline inputs (no nested form)
  const [addingVeh, setAddingVeh] = useState(false);
  const [newVeh, setNewVeh] = useState<{ unit_number: string; plate: string; year: string; make: string; model: string; vin: string }>({
    unit_number: "", plate: "", year: "", make: "", model: "", vin: ""
  });
  const yearNum = newVeh.year ? Number(newVeh.year) : null;

  // 1) Load markets + FMC on mount
  useEffect(() => {
    (async () => {
      try {
        setLoadingMarkets(true);
        const m = await getJSON("/api/lookups?scope=locations&flat=1");
        setMarkets(asArray<Market>(m));
      } finally {
        setLoadingMarkets(false);
      }

      try {
        setLoadingFmc(true);
        const f = await getJSON("/api/lookups?scope=fmc&flat=1");
        setFmc(asArray<FmcItem>(f));
      } finally {
        setLoadingFmc(false);
      }
    })();
  }, []);

  // 2) Load customers when market changes
  useEffect(() => {
    (async () => {
      try {
        setLoadingCustomers(true);
        const url = marketId
          ? `/api/lookups?scope=customers&market=${marketId}&flat=1`
          : `/api/lookups?scope=customers&flat=1`;
        const c = await getJSON(url);
        setCustomers(asArray<Customer>(c));
        setCustomerId("");
        setVehicleId("");
        setVehicles([]);
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, [marketId]);

  // 3) Load vehicles when customer changes (vehicles are scoped to customer)
  useEffect(() => {
    (async () => {
      if (!customerId) {
        setVehicles([]);
        setVehicleId("");
        return;
      }
      try {
        setLoadingVehicles(true);

        const res = await fetch(`/api/vehicles?customer_id=${customerId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          // Surface server error to DevTools + (optional) alert
          const text = await res.text().catch(() => "");
          console.error("GET /api/vehicles failed", res.status, text);
          // alert(`Vehicles failed (${res.status}). ${text || ""}`); // optional
          setVehicles([]);
          setVehicleId("");
          return;
        }

        const v = await res.json().catch(() => []);
        setVehicles(Array.isArray(v) ? v : Array.isArray(v?.rows) ? v.rows : []);
        setVehicleId("");
      } finally {
        setLoadingVehicles(false);
      }
    })();
  }, [customerId]);

  const canSubmit = useMemo(() => !!customerId, [customerId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      market_id: marketId || null,
      customer_id: customerId || null,
      vehicle_id: vehicleId || null,
      fmc_id: fmcId || null,
      po: po || null,
      notes: notes || null,
    };

    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      alert(`Failed to create request${txt ? `: ${txt}` : ""}`);
      return;
    }
    window.location.href = "/office/queue";
  }

  // NOT a submit handler anymore — called by a button inside the main form
  async function onAddVehicle() {
    if (!customerId) {
      alert("Select a customer first.");
      return;
    }
    const body = {
      customer_id: customerId,
      unit_number: newVeh.unit_number || null,
      plate: newVeh.plate || null,
      year: yearNum,
      make: newVeh.make || null,
      model: newVeh.model || null,
      vin: newVeh.vin || null,
    };

    const r = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      alert(`Failed to add vehicle${txt ? `: ${txt}` : ""}`);
      return;
    }
    const created: Vehicle = await r.json();
    // refresh list and auto-select
    setVehicles((prev) => [created, ...prev]);
    setVehicleId(created.id);
    setAddingVeh(false);
    setNewVeh({ unit_number: "", plate: "", year: "", make: "", model: "", vin: "" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Market */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Market</label>
        <select
          className="w-full border rounded p-2"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value as Id)}
          disabled={loadingMarkets || markets.length === 0}
        >
          <option value="">{loadingMarkets ? "Loading markets…" : "Select a market…"}</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Customer */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Customer</label>
        <select
          className="w-full border rounded p-2"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value as Id)}
          disabled={!marketId || loadingCustomers || customers.length === 0}
        >
          <option value="">
            {!marketId ? "Select a market first…" : loadingCustomers ? "Loading customers…" : "Select a customer…"}
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {marketId && !loadingCustomers && customers.length === 0 && (
          <p className="text-xs text-red-600">No customers assigned to this market.</p>
        )}
      </div>

      {/* Vehicle + Add Vehicle (no nested form) */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Vehicle</label>
        <div className="flex gap-3">
          <select
            className="w-full border rounded p-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value as Id)}
            disabled={!customerId || loadingVehicles}
          >
            <option value="">
              {!customerId ? "Select a customer first…" : loadingVehicles ? "Loading vehicles…" : "Select a vehicle…"}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {vehicleLabel(v)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="border rounded px-3 py-2"
            disabled={!customerId}
            onClick={() => setAddingVeh((x) => !x)}
            title="+ Add vehicle to this customer"
          >
            + Add Vehicle
          </button>
        </div>

        {addingVeh && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="border rounded p-2"
              placeholder="Unit #"
              value={newVeh.unit_number}
              onChange={(e) => setNewVeh({ ...newVeh, unit_number: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Plate"
              value={newVeh.plate}
              onChange={(e) => setNewVeh({ ...newVeh, plate: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Year"
              inputMode="numeric"
              value={newVeh.year}
              onChange={(e) => setNewVeh({ ...newVeh, year: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Make"
              value={newVeh.make}
              onChange={(e) => setNewVeh({ ...newVeh, make: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="Model"
              value={newVeh.model}
              onChange={(e) => setNewVeh({ ...newVeh, model: e.target.value })}
            />
            <input
              className="border rounded p-2"
              placeholder="VIN"
              value={newVeh.vin}
              onChange={(e) => setNewVeh({ ...newVeh, vin: e.target.value })}
            />
            <div className="md:col-span-3 flex gap-2">
              <button className="border rounded px-4 py-2" type="button" onClick={onAddVehicle}>
                Save Vehicle
              </button>
              <button className="border rounded px-4 py-2" type="button" onClick={() => setAddingVeh(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FMC */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">FMC</label>
        <select
          className="w-full border rounded p-2"
          value={fmcId}
          onChange={(e) => setFmcId(e.target.value)}
          disabled={loadingFmc || fmc.length === 0}
        >
          <option value="">{loadingFmc ? "Loading options…" : "Select an option…"}</option>
          {fmc.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* PO / Notes */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">PO (optional)</label>
        <input className="w-full border rounded p-2" value={po} onChange={(e) => setPo(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Notes (optional)</label>
        <textarea className="w-full border rounded p-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button className="border rounded px-4 py-2 disabled:opacity-50" disabled={!canSubmit}>
        Create Request
      </button>
    </form>
  );
}
