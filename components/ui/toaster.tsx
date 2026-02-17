"use client";

import { useEffect, useState } from "react";
import {
  Toast,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; description: string }[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const msg = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, description: msg }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("revlet-toast", handleToast);
    return () => window.removeEventListener("revlet-toast", handleToast);
  }, []);

  return (
    <ToastProvider>
      {toasts.map(({ id, description }) => (
        <Toast key={id}>
          <div className="text-sm font-medium">
            {description}
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}