"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/toast";

export function Toaster() {
  const [toasts, setToasts] = useState<{ id: number; description: string }[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const msg = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, description: msg }]);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("revlet-toast", handleToast);
    return () => window.removeEventListener("revlet-toast", handleToast);
  }, []);

  return (
    // Fixed: Using a simple div container since your Toast is custom CSS
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(({ id, description }) => (
        <div key={id} className="pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
          <Toast description={description} />
        </div>
      ))}
    </div>
  );
}