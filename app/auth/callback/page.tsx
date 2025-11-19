'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export const dynamic = "force-dynamic"; // ⬅ prevents prerendering

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    async function finishSignIn() {
      if (!code) {
        router.replace('/');
        return;
      }

      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth error:', error);
        router.replace('/?error=auth_failed');
        return;
      }

      router.replace('/');
    }

    finishSignIn();
  }, [router, searchParams]);

  return <p>Completing sign-in...</p>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <CallbackInner />
    </Suspense>
  );
}
