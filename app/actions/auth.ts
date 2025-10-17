'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

export async function signOutAction() {
  // This runs on the server, so we *can* modify cookies here.
  const sb = await supabaseServer();

  // Best-effort sign out; ignore errors so UI never gets stuck on signout
  try {
    await sb.auth.signOut();
  } catch {
    /* no-op */
  }

  // Send the user somewhere after signing out
  redirect('/'); // or '/login' if you have a login route
}
