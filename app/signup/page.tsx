"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Updated State to include 'address'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    company: "",
    phone: "",
    fleetSize: "",
    address: "" // 👈 Added
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          company_name: formData.company,
          phone: formData.phone,
          fleet_size: formData.fleetSize,
          billing_address: formData.address, // 👈 Sending Address to Metadata
          role: 'CUSTOMER'
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/signup/pending');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        
        <div className="bg-black px-8 py-6 text-center">
          <h1 className="text-xl font-black tracking-tighter italic text-white">REVLET</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">New Customer Registration</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Full Name</label>
                    <input name="fullName" required onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black" placeholder="John Doe" />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Phone</label>
                    <input name="phone" required onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black" placeholder="(555) 123-4567" />
                </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Company Name</label>
              <input name="company" required onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black" placeholder="DHL Express" />
            </div>

            {/* 👈 Added Address Input Field */}
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Business Address / Location</label>
              <input name="address" required onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black" placeholder="123 Main St, San Antonio" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Fleet Size (Est.)</label>
              <select name="fleetSize" onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black">
                  <option value="">Select Size...</option>
                  <option value="1-5">1-5 Vehicles</option>
                  <option value="6-20">6-20 Vehicles</option>
                  <option value="20+">20+ Vehicles</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Work Email</label>
              <input name="email" type="email" required onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black" placeholder="manager@company.com" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Password</label>
              <input name="password" type="password" required onChange={handleChange} className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-black" placeholder="••••••••" minLength={6} />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition shadow-lg mt-2">
              {loading ? "Submitting..." : "Submit for Approval"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs font-bold text-zinc-400 hover:text-black transition">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}