"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ScopeCtx = {
  locationId: string | null;
  /** e.g. "location_id=<uuid>" ("" when not scoped) */
  queryFragment: string;
  setLocationId: (id: string | null) => void;
  clear: () => void;
};

const Ctx = createContext<ScopeCtx | undefined>(undefined);

export function LocationScopeProvider({ children }: { children: React.ReactNode }) {
  const [locationId, setLocationId] = useState<string | null>(null);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("scope:location_id");
      if (raw) setLocationId(raw);
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try {
      if (locationId) {
        window.localStorage.setItem("scope:location_id", locationId);
      } else {
        window.localStorage.removeItem("scope:location_id");
      }
    } catch {}
  }, [locationId]);

  const queryFragment = useMemo(
    () => (locationId ? `location_id=${encodeURIComponent(locationId)}` : ""),
    [locationId]
  );

  const value = useMemo(
    () => ({
      locationId,
      queryFragment,
      setLocationId,
      clear: () => setLocationId(null),
    }),
    [locationId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocationScope() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocationScope must be used within <LocationScopeProvider>");
  return ctx;
}
