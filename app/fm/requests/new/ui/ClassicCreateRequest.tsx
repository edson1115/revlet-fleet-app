// app/fm/requests/new/ui/ClassicCreateRequest.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Id = string;

type Market = { id: Id; name: string };
type Customer = { id: Id; name: string; market?: Id | null };
type Vehicle = {
  id: Id;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  plate?: string | null;
  unit_number?: string | null;
};
type Fmc = { id: Id; label: string };

async function getJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export default function ClassicCreateRequest() {
  // lookups
  const [markets, setMarkets] = useState<Market[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fmc, setFmc] = useState<Fmc[]>([]);

  // selections
  const [marketId, setMarketId] = useState<Id | "">("");
  const [customerId, setCustomerId] = useState<Id | "">("");
  const [vehicleId, setVehicleId] = useState<Id | "">("");
  const [fmcId, setFmcId] = useState<Id | "">("");

  // fields
  const [service, setService] = useState("");
  const [po, setPo] = useState("");
  const [notes, setNotes] = useState("");
  const [mileage, setMileage] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  // derived
  const vehicleLabel = (v: Vehicle) =>
    [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");

  const canSubmit = useMemo(() => {
    return !!vehicleId && !!marketId && !!customerId && service.trim().length > 0 && !submitting;
  }, [vehicleId, marketId, customerId, service, submitting]);

  // initial loads
  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const loc = await getJSON<{ markets: Market[] }>("/api/lookups?scope=locations");
        setMarkets(loc.markets ?? []);

        const veh = await getJSON<{ vehicles: Vehicle[] }>("/api/vehicles");
        setVehicles(veh.vehicles ?? []);

        const f = await getJSON<{ options: Fmc[] }>("/api/lookups?scope=fmc");
        setFmc(f.options ?? []);

        if ((loc.markets ?? []).length === 1) setMarketId((loc.markets ?? [])[0].id);
      } catch (e: any) {
        setErr(e?.message || "Failed to load lookups.");
      }
    })();
  }, []);

  // load customers on market change (filter by id)
  useEffect(() => {
    (async () => {
      setErr("");
      setCustomers([]);
      setCustomerId("");
      try {
        const url = marketId
          ? `/api/lookups?scope=customers&market=${encodeURIComponent(marketId)}`
          : `/api/lookups?scope=customers`;
        const c = await getJSON<{ customers: Customer[] }>(url);
        setCustomers(c.customers ?? []);
      } catch (e: any) {
        setErr(e?.message || "Failed to load customers.");
      }
    })();
  }, [marketId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErr("");
    setOkMsg("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // required
          vehicle_id: vehicleId,
          customer_id: customerId,
          service: service.trim(),
          // optional
          po: po.trim() || null,
          notes: notes.trim() || null,
          mileage: mileage === "" ? null : Number(mileage),
          fmc_id: fmcId || null,
          // future-proof — kept for reference; API ignores if not present in schema
          market_id: marketId,
        }),
      });
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch {}
      if (!res.ok) throw new Error(json?.error || text || "Failed to create request");

      setOkMsg("Request created. Redirecting to Office…");
      setTimeout(() => (window.location.href = "/office/queue"), 400);
    } catch (e: any) {
      setErr(e?.message || "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {okMsg && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{okMsg}</div>}

      {/* Vehicle */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Vehicle</label>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value as Id)}
        >
          <option value="">Select vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {vehicleLabel(v) || v.id}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500">
          Don’t see it?
          <a className="ml-1 underline text-blue-600" href="/vehicles/new">Add a vehicle</a>.
        </div>
      </div>

      {/* Market */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Location (Market)</label>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value as Id)}
        >
          <option value="">Select market…</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <div className="text-xs text-gray-500">Customer list is filtered by this selection.</div>
      </div>

      {/* Customer */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Customer</label>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value as Id)}
          disabled={!marketId && customers.length === 0}
        >
          <option value="">{marketId ? "Select customer…" : "Select a market or choose from all customers…"}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {marketId && customers.length === 0 && (
          <div className="text-xs text-gray-500">No customers assigned to this market.</div>
        )}
      </div>

      {/* Service */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Service</label>
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="Describe service (e.g., PM A, Brakes, Diagnostic)"
        />
      </div>

      {/* FMC / Mileage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">FMC (optional)</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={fmcId}
            onChange={(e) => setFmcId(e.target.value as Id)}
          >
            <option value="">Select FMC…</option>
            {fmc.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Mileage (optional)</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-xl border px-3 py-2"
            value={mileage}
            onChange={(e) => setMileage(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Odometer"
          />
        </div>
      </div>

      {/* PO / Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">PO (optional)</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={po}
            onChange={(e) => setPo(e.target.value)}
            placeholder="Purchase Order"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes (optional)</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details for the office/tech"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={!canSubmit} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">
          {submitting ? "Submitting…" : "Create Request"}
        </button>
      </div>
    </form>
  );
}
