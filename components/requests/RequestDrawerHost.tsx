// components/request/RequestDrawerHost.tsx
"use client";

import RequestDrawer from "./RequestDrawer";
import { useRequestDrawer } from "@/lib/hooks/useRequestDrawer";

export function RequestDrawerHost() {
  const { id, isOpen, close } = useRequestDrawer();

  if (!isOpen || !id) return null;

  return <RequestDrawer id={id} onClose={close} />;
}
