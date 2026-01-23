"use server";

import { createClient } from "@supabase/supabase-js";

export async function inviteCustomerUser(email: string, fullName: string) {
  // 1. Create a Supabase Client with SUPER ADMIN rights
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // This is safe here on the server
  );

  // 2. Send the Invite
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: "CUSTOMER" // Important: Assign the role so they see the Customer Portal
    },
    // redirectTo: "http://localhost:3000/auth/callback" // Optional: Where they land after setting password
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}