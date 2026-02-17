"use client";

import { useEffect, useState } from "react";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; title?: string; description: string }[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const msg = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, description: msg }]);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("revlet-toast", handleToast);
    return () => window.removeEventListener("revlet-toast", handleToast);
  }, []);

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description }) => (
        <Toast key={id}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}