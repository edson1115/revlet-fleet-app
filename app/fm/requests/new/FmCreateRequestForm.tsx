// app/fm/requests/new/FmCreateRequestForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Id = string;
type Vehicle = { id: Id; year: number|null; make: string; model: string; unit_number: string|null };
type Market = { id: Id; name: string };
type Customer = { id: Id; name: string; market_id: Id|null };

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function FmCreateRequestForm() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [marketId, setMarketId] = useState<Id | "">("");
  const [customerId, setCustomerId] = useState<Id | "">("");
  const [vehicleId, setVehicleId] = useState<Id | "">("");
  const [po, setPo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      const m = await getJSON<Market[]>("/api/lookups?scope=locations");
      setMarkets(m);
      const vs = await getJSON<Vehicle[]>("/api/vehicles");
      setVehicles(vs);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const url = marketId ? `/api/lookups?scope=customers&market=${marketId}` : `/api/lookups?scope=customers`;
      const cs = await getJSON<Customer[]>(url);
      setCustomers(cs);
      setCustomerId(""); // reset selection when market changes
    })();
  }, [marketId]);

  const filteredCustomers = useMemo(() => customers, [customers]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: vehicleId || null,
        customer_id: customerId || null,
        po: po || null,
        notes: notes || null,
        market_id: marketId || null,
      }),
    });
    if (!r.ok) {
      alert(await r.text());
      return;
    }
    // TODO: redirect to /office/queue or success state
    window.location.href = "/office/queue";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Market</label>
        <select value={marketId} onChange={e => setMarketId(e.target.value as Id)} className="border p-2 w-full">
          <option value="">Select a market…</option>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Customer</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value as Id)} className="border p-2 w-full">
          <option value="">Select a customer…</option>
          {filteredCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Vehicle</label>
        <select value={vehicleId} onChange={e => setVehicleId(e.target.value as Id)} className="border p-2 w-full">
          <option value="">Select a vehicle…</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.unit_number ?? `${v.year ?? ""} ${v.make} ${v.model}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">PO (optional)</label>
        <input value={po} onChange={e => setPo(e.target.value)} className="border p-2 w-full" />
      </div>

      <div>
        <label className="block text-sm font-medium">Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border p-2 w-full" />
      </div>

      <button className="border px-4 py-2">Create Request</button>
    </form>
  );
}
