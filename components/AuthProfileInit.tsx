"use client";

import { useEffect } from "react";

export function AuthProfileInit() {
  useEffect(() => {
    // This POST creates profile if missing
    fetch("/api/auth/ensure-profile", {
      method: "POST",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  return null; // nothing rendered
}
