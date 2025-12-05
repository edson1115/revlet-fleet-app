"use client";

import { useEffect } from "react";
import { useRequestDrawer } from "@/lib/store/requestDrawer";
import RequestDrawer from "./RequestDrawer";

export function RequestDrawerHost() {
  const { isOpen, requestId, close } = useRequestDrawer();

  // Prevent page scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  if (!isOpen || !requestId) return null;

  return (
    <RequestDrawer
      id={requestId}
      onClose={close}
    />
  );
}
