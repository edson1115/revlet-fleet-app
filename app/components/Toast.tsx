// app/components/Toast.tsx
'use client';
import { useEffect, useState } from 'react';

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => setMsg(m);
  const Toast = () =>
    msg ? (
      <div className="fixed bottom-4 right-4 rounded-lg bg-black/80 text-white px-4 py-2 shadow-lg z-50">
        {msg}
      </div>
    ) : null;

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  return { show, Toast };
}
