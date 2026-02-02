import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveUserScope } from "@/lib/api/scope";
import { sendApprovalEmail } from "@/lib/email"; // 👈 IMPORTED EMAILER

export const dynamic = "force-dynamic";

// ⚠️ ADMIN CLIENT (Bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isAuthorized = (role: string) => {
  return ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"].includes(role);
};

export async function GET() {
  const scope = await resolveUserScope();

  if (!scope.uid || !isAuthorized(scope.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  
  // 1. Strict Security Check
  if (!scope.uid || !["SUPERADMIN", "SUPER_ADMIN"].includes(scope.role)) {
      return NextResponse.json({ error: "Only Super Admins can delete users" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
  }

  try {
      // 2. CLEANUP DATABASE RECORDS FIRST (Prevent Foreign Key Errors)
      await supabaseAdmin.from('sales_leads').delete().eq('sales_rep_id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

      // 3. DELETE AUTH USER (The Master Record)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (error) {
          console.error("Auth Delete Error:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });

  } catch (err: any) {
      console.error("Delete Handler Error:", err);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid || !isAuthorized(scope.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  const body = await request.json();
  const { userId, role, active, status } = body;
  
  // 1. Update Auth Metadata (if role provided)
  if (role) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role: role }
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // 2. Update Database Profile (Handle Role, Active, Status)
  const updates: any = {};
  if (role) updates.role = role;
  if (typeof active === 'boolean') updates.active = active;
  if (status) updates.status = status;

  if (Object.keys(updates).length > 0) {
    const { error: dbError } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // 3. 🧠 AUTO-SYNC & NOTIFY
  // If we are approving a user (setting them to ACTIVE), do the magic setup
  if (status === 'ACTIVE' && active === true) {
    
    // A. Get the full profile data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // ... inside the PATCH function ...

    if (profile) {
        // 📧 SEND APPROVAL EMAIL
        if (profile.email) {
            // 👇 You can change "Revlet Fleet Services" to your actual Shop Name
            await sendApprovalEmail(
                profile.email, 
                profile.full_name || "Partner", 
                "Revlet Fleet Services" 
            );
        }

// ... rest of the code ...

        // B. Handle Customer/Company Linking Logic
        if (profile.role === 'CUSTOMER' || role === 'CUSTOMER') {
            
            // Check if Company exists (Match by Name)
            const { data: existingCompany } = await supabaseAdmin
              .from('customers')
              .select('id')
              .ilike('company_name', profile.company_name) // Case-insensitive match
              .maybeSingle();

            let finalCustomerId = existingCompany?.id;

            // If no company exists, CREATE IT NOW
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
                
                if (!createError && newCompany) {
                   finalCustomerId = newCompany.id;
                }
            }

            // Link the User Profile to this Company
            if (finalCustomerId) {
                await supabaseAdmin
                  .from('profiles')
                  .update({ customer_id: finalCustomerId })
                  .eq('id', userId);
                
                await supabaseAdmin.auth.admin.updateUserById(userId, {
                  user_metadata: { customer_id: finalCustomerId }
                });
            }
        }
    }
  }
  
  return NextResponse.json({ success: true });
}