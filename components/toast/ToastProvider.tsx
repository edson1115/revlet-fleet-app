"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

type ToastContextType = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  function show(msg: string) {
    setMessage(msg);
    // small hack: trigger shadcn toaster
    const event = new CustomEvent("revlet-toast", { detail: msg });
    window.dispatchEvent(event);
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToastRevlet() {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error("useToastRevlet must be used within <ToastProvider>");
  return ctx;
}
