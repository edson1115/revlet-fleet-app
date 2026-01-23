"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr"; // ✅ Updated to match your project

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ✅ Use the correct client creator
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Trigger Supabase Password Reset Email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/update-password`,
    });

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ 
        text: "Check your email! We sent you a link to reset your password.", 
        type: "success" 
      });
      setEmail(""); // Clear form
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-black px-8 py-6 text-center">
          <h1 className="text-xl font-black tracking-tighter italic text-white">REVLET</h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Account Recovery</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-black text-zinc-900 mb-2">Forgot Password?</h2>
          <p className="text-sm text-zinc-500 mb-6 font-medium">
            Enter the email associated with your account and we'll send you a login link.
          </p>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-black outline-none transition"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <Link href="/login" className="block text-xs font-bold text-zinc-400 hover:text-black transition">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}