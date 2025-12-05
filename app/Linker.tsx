'use client';

import { useEffect } from 'react';

/**
 * Calls /api/auth/link-user once on mount to set app_users.auth_user_id
 * for the currently logged-in Supabase user (first-login linking).
 * Silent no-op if unauthenticated.
 */
export default function Linker() {
  useEffect(() => {
    // fire-and-forget; ignore failures
    fetch('/api/auth/link-user', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}



