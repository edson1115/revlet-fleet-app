import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  // ⚠️ Ensure SUPABASE_SERVICE_ROLE_KEY is in your .env.local file
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const testUsers = [
    { email: 'joes@test.com', name: 'Joe' },
    { email: 'bob@dhl.com', name: 'Bob' },
    { email: 'edson.oreilly@gmail.com', name: 'Edson O' },
    { email: 'edson.cortes210@gmail.com', name: 'Edson C' },
  ];

  const results = [];

  for (const u of testUsers) {
    // 1. Check if user exists in Auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(x => x.email === u.email);

    let userId = existingUser?.id;

    if (existingUser) {
      // UPDATE PASSWORD
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: 'password123',
        email_confirm: true,
        user_metadata: { role: 'CUSTOMER' } // Ensure they are customers
      });
      results.push(`✅ Updated password for ${u.email}`);
    } else {
      // CREATE USER
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { role: 'CUSTOMER', name: u.name }
      });
      
      if (error) {
        results.push(`❌ Failed to create ${u.email}: ${error.message}`);
        continue;
      }
      userId = data.user.id;
      results.push(`✨ Created new user ${u.email}`);
    }

    // 2. Auto-Approve in Database (Set Status to ACTIVE)
    // We try to update both profiles and customers tables to be safe
    if (userId) {
       // Update Profile Status
       await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('id', userId);
       
       // Update Customer Status (by email link if profile link fails)
       await supabase.from('customers').update({ status: 'ACTIVE' }).eq('email', u.email);
       
       results.push(`   ↳ Set status to ACTIVE`);
    }
  }

  return NextResponse.json({ 
    message: "Test Users Updated", 
    results 
  });
}