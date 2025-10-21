// app/fm/requests/new/ui/useLookupData.ts
"use client";

import { useEffect, useMemo, useState } from "react";

type Id = string;
export type Market   = { id: Id; name: string };
export type Customer = { id: Id; name: string; market: string | null };
export type Vehicle  = { id: Id; year: number | null; make: string; model: string; unit_number: string | null };

function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && Array.isArray(v.rows)) return v.rows as T[];
  return [];
}

async function getJSON(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  try { return await r.json(); } catch { return []; }
}

export function useLookupData() {
  // data
  const [markets, setMarkets] = useState<Market[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // selections
  const [marketId, setMarketId] = useState<Id | "">("");
  const [customerId, setCustomerId] = useState<Id | "">("");
  const [vehicleId, setVehicleId] = useState<Id | "">("");

  // loading
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // load markets + vehicles
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
        setLoadingVehicles(true);
        const v = await getJSON("/api/vehicles"); // ok if 404 → we normalize to []
        setVehicles(asArray<Vehicle>(v));
      } catch {
        setVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    })();
  }, []);

  // load customers when market changes
  useEffect(() => {
    (async () => {
      try {
        setLoadingCustomers(true);
        const url = marketId
          ? `/api/lookups?scope=customers&market=${marketId}&flat=1`
          : `/api/lookups?scope=customers&flat=1`;
        const c = await getJSON(url);
        setCustomers(asArray<Customer>(c));
        setCustomerId(""); // reset on market change
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, [marketId]);

  const canSubmit = useMemo(() => !!customerId, [customerId]);

  return {
    // data
    markets, customers, vehicles,
    // selections
    marketId, setMarketId,
    customerId, setCustomerId,
    vehicleId, setVehicleId,
    // loading
    loadingMarkets, loadingCustomers, loadingVehicles,
    // derived
    canSubmit,
  };
}
