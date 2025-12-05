// components/Toast.tsx
"use client";

import { useEffect } from "react";

export default function Toast({
  kind = "success",
  message,
  onClose,
  autoHideMs = 3500,
}: {
  kind?: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(t);
  }, [onClose, autoHideMs]);

  const color =
    kind === "success"
      ? "bg-green-600"
      : kind === "error"
      ? "bg-red-600"
      : "bg-gray-800";

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${color} text-white rounded shadow px-4 py-3 min-w-64`}>
        <div className="flex items-start gap-3">
          <span className="font-semibold capitalize">{kind}</span>
          <span className="opacity-90">{message}</span>
          <button
            onClick={onClose}
            className="ml-auto text-white/80 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}



