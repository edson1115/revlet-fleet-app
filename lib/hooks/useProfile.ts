// lib/hooks/useProfile.ts
"use client";

import { useEffect, useState } from "react";

export type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role: "SUPERADMIN" | "OFFICE" | "DISPATCH" | "TECH" | "CUSTOMER" | string;
  markets: string[];
  active: boolean;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  async function load() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load profile");

      setProfile(json);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { profile, loading, error, refresh: load };
}



