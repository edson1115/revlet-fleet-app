// app/api/me/route.ts
import { getSupabase, json, onError } from '@/lib/auth/requireRole';

export async function GET() {
  try {
    const supabase = await getSupabase();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
      // Not logged in -> guest
      return json({ authenticated: false, role: null });
    }

    const { data: me } = await supabase
      .from('users')
      .select('role, company_id, auth_user_id')
      .eq('auth_user_id', auth.user.id)
      .maybeSingle();

    return json({
      authenticated: true,
      email: auth.user.email ?? null,
      role: me?.role ?? null,
      company_id: me?.company_id ?? null,
    });
  } catch (e) {
    return onError(e);
  }
}
