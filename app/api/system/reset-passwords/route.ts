import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force this route to be dynamic so it runs every time you visit it
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const usersToUpdate = [
    { email: "customer@test.com", role: "CUSTOMER" },
    { email: "office@test.com", role: "OFFICE" },
    { email: "dispatch@test.com", role: "DISPATCHER" },
    { email: "tech@test.com", role: "TECH" },
    { email: "admin@test.com", role: "ADMIN" },
    { email: "edson.bigotires@gmail.com", role: "SUPERADMIN" }
  ];

  const results = [];

  for (const u of usersToUpdate) {
      // 1. List users to find the ID
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.find(existing => existing.email === u.email);

      if (user) {
          // 2. Update existing user
          const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
              password: 'password123',
              user_metadata: { role: u.role },
              email_confirm: true
          });
          if (error) results.push(`❌ Failed ${u.email}: ${error.message}`);
          else results.push(`✅ Updated ${u.email} (${u.role})`);
      } else {
          // 3. Create new user
          const { error } = await supabaseAdmin.auth.admin.createUser({
              email: u.email,
              password: 'password123',
              email_confirm: true,
              user_metadata: { role: u.role }
          });
          if (error) results.push(`❌ Failed create ${u.email}: ${error.message}`);
          else results.push(`✨ Created ${u.email}`);
      }
  }

  return NextResponse.json({ results });
}