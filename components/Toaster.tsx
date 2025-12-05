// components/Toaster.tsx
"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import Toast from "./Toast";

type ToastItem = {
  id: string;
  kind?: "success" | "error" | "info";
  message: string;
  autoHideMs?: number;
};

type ToastCtx = {
  push: (message: string, opts?: { kind?: ToastItem["kind"]; autoHideMs?: number }) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback(
    (message: string, opts?: { kind?: ToastItem["kind"]; autoHideMs?: number }) => {
      const id = Math.random().toString(36).slice(2, 9);
      setItems((prev) => [...prev, { id, message, kind: opts?.kind ?? "success", autoHideMs: opts?.autoHideMs }]);
    },
    []
  );

  const onClose = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<ToastCtx>(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {items.map((t) => (
        <Toast
          key={t.id}
          kind={t.kind}
          message={t.message}
          autoHideMs={t.autoHideMs ?? 3500}
          onClose={() => onClose(t.id)}
        />
      ))}
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}



