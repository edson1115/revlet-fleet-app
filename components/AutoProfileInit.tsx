"use client";

import { useEffect } from "react";

export function AuthProfileInit() {
  useEffect(() => {
    fetch("/api/auth/ensure-profile", { method: "POST" });
  }, []);

  return null;
}
