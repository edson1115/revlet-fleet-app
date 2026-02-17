import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserScope } from "@/lib/api/scope";
import { sendApprovalEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// ✅ Helper to initialize admin client only when needed
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const isAuthorized = (role: string) => {
  return ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"].includes(role);
};

export async function GET() {
  const scope = await resolveUserScope();
  if (!scope.uid || !isAuthorized(scope.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getAdminClient();
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formattedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || "Unknown",
    role: u.user_metadata?.role || "N/A",
    customer_id: u.user_metadata?.customer_id || null,
    has_password: !!u.email_confirmed_at || !!u.last_sign_in_at,
    email_confirmed: !!u.email_confirmed_at,
    last_sign_in: u.last_sign_in_at,
    created_at: u.created_at
  }));

  return NextResponse.json({ users: formattedUsers });
}

export async function DELETE(request: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid || !["SUPERADMIN", "SUPER_ADMIN"].includes(scope.role || "")) {
      return NextResponse.json({ error: "Only Super Admins can delete users" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "Missing User ID" }, { status: 400 });

  const supabaseAdmin = getAdminClient();
  try {
      await supabaseAdmin.from('sales_leads').delete().eq('sales_rep_id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return NextResponse.json({ success: true });
  } catch (err: any) {
      console.error("Delete Handler Error:", err);
      return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid || !isAuthorized(scope.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  const body = await request.json();
  const { userId, role, active, status } = body;
  const supabaseAdmin = getAdminClient();
  
  if (role) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: role }
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const updates: any = {};
  if (role) updates.role = role;
  if (typeof active === 'boolean') updates.active = active;
  if (status) updates.status = status;

  if (Object.keys(updates).length > 0) {
    const { error: dbError } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (status === 'ACTIVE' && active === true) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) {
        if (profile.email) {
            await sendApprovalEmail(
                profile.email, 
                profile.full_name || "Partner", 
                "Revlet Fleet Services" 
            );
        }

        if (profile.role === 'CUSTOMER' || role === 'CUSTOMER') {
            const { data: existingCompany } = await supabaseAdmin
              .from('customers')
              .select('id')
              .ilike('company_name', profile.company_name)
              .maybeSingle();

            let finalCustomerId = existingCompany?.id;

            if (!finalCustomerId && profile.company_name) {
                const { data: newCompany, error: createError } = await supabaseAdmin
                  .from('customers')
                  .insert({
                      company_name: profile.company_name,
                      contact_name: profile.full_name,
                      email: profile.email,
                      phone: profile.phone,
                      billing_address: profile.billing_address,
                      market: 'San Antonio',
                      status: 'ACTIVE'
                  })
                  .select()
                  .single();
                
                if (!createError && newCompany) finalCustomerId = newCompany.id;
            }

            if (finalCustomerId) {
                await supabaseAdmin.from('profiles').update({ customer_id: finalCustomerId }).eq('id', userId);
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                  user_metadata: { customer_id: finalCustomerId }
                });
            }
        }
    }
  }
  
  return NextResponse.json({ success: true });
}