// components/AutoProfileInit.tsx
"use client";

import { useEffect } from "react";

export function AutoProfileInit() {
  useEffect(() => {
    fetch("/api/auth/ensure-profile", { method: "POST" });
  }, []);

  return null;
}
