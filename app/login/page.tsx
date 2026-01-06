"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Magic Link sent! Check your email.");
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* LEFT: BRANDING & FORM */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="max-w-md w-full mx-auto">
          
          {/* LOGO */}
          <div className="mb-12">
            <h1 className="text-4xl font-black tracking-tighter italic">
              REVLET<span className="text-blue-600">FLEET</span>
            </h1>
            <p className="text-gray-400 text-sm font-bold tracking-widest uppercase mt-1">
              Enterprise Operations
            </p>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back.</h2>
          <p className="text-gray-500 mb-10">Sign in to manage your fleet and service requests.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Work Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-900 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending Magic Link..." : "Send Magic Link →"}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center font-bold text-sm animate-in slide-in-from-bottom-2 ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700 border border-green-100"}`}>
              {message}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Need access? Contact your System Administrator.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: VISUAL SIDE */}
      <div className="hidden lg:block w-[55%] relative overflow-hidden bg-gray-900">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600 rounded-full blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-20 text-white">
          <blockquote className="space-y-4 max-w-lg">
             <div className="text-6xl font-serif text-blue-500 opacity-50">"</div>
             <p className="text-2xl font-medium leading-relaxed">
               The most reliable fleet management platform we've ever used. Simple, fast, and built for scale.
             </p>
             <footer className="flex items-center gap-4 pt-4">
               <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">R</div>
               <div>
                 <div className="font-bold">Revlet System</div>
                 <div className="text-gray-400 text-sm">v2.0 Command Center</div>
               </div>
             </footer>
          </blockquote>
        </div>
      </div>

    </div>
  );
}