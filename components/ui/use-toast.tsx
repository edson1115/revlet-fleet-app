// components/ui/use-toast.ts
"use client";

import * as React from "react";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastContextState = {
  toast: (opts: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextState | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  function toast(opts: Omit<Toast, "id">) {
    setToasts((prev) => [
      ...prev,
      { ...opts, id: Math.random().toString(36).substring(2) },
    ]);
  }

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Host UI */}
      <div className="fixed bottom-6 right-6 space-y-3 z-[9999]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-black text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2"
            onClick={() => remove(t.id)}
          >
            {t.title && <div className="font-semibold">{t.title}</div>}
            {t.description && (
              <div className="text-sm opacity-90">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
