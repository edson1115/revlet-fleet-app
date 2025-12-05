"use client";

import React, { createContext, useContext, useState } from "react";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }: any) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, type: "success" | "error") {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);

    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-4 right-4 space-y-3 z-[9999]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white 
              ${t.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}



