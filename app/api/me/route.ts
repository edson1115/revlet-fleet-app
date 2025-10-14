// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let role: string | null = null;
    let customer_id: string | null = null;
    let company_id: string | null = null;

    if (user?.email) {
      const { data } = await supabase
        .from('app_users')
        .select('role, customer_id, company_id')
        .eq('email', user.email)
        .maybeSingle();

      if (data) {
        role = data.role;
        customer_id = data.customer_id;
        company_id = data.company_id;
      }
    }

    return NextResponse.json({
      authenticated: !!user,
      email: user?.email ?? null,
      role,
      customer_id,
      company_id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
