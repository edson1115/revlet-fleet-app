'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function AuthCallback() {
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

      router.replace('/'); // Redirect to the app home (Supabase session is now set)
    }

    finishSignIn();
  }, [router, searchParams]);

  return (
    <div className="p-6 text-center">
      <p>Completing sign-in...</p>
    </div>
  );
}
