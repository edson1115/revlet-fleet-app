// app/components/useSuccessQueryToast.ts
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useSuccessQueryToast(showToast: (msg: string) => void) {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const map: Record<string, string> = {
      created: 'Request created.',
      scheduled: 'Job scheduled.',
      started: 'Job marked In Progress.',
      completed: 'Job completed.',
    };

    let hit: string | null = null;
    for (const k of Object.keys(map)) {
      if (params.get(k) === '1') {
        hit = k;
        break;
      }
    }
    if (!hit) return;

    showToast(map[hit]);
    const sp = new URLSearchParams(params.toString());
    sp.delete(hit);
    router.replace(`?${sp.toString()}`, { scroll: false });
  }, [params, router, showToast]);
}
