"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// --- ICONS ---
const IconLock = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IconMail = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconEye = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const IconEyeOff = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;
const IconShield = () => <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

export default function LoginPage() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;

    console.log("REVLET AUTH: Authenticated as", role);

    // 🚥 THE TRAFFIC CONTROLLER
    let targetPath = '/office'; // Default fallback
    
    // Normalize role to ensure case-insensitivity if needed
    const r = role?.toUpperCase() || "";

    if (r === 'SUPERADMIN' || r === 'ADMIN' || r === 'SUPER_ADMIN') {
      targetPath = '/admin/users';
    } else if (r === 'TECH' || r === 'TECHNICIAN') {
      targetPath = '/tech';
    } else if (r === 'CUSTOMER') {
      targetPath = '/customer'; 
    } else if (r === 'DISPATCH' || r === 'DISPATCHER') { // ✅ ADDED DISPATCH LOGIC
      targetPath = '/dispatch';
    }

    router.prefetch(targetPath);

    // Wait slightly for cookie to set, then refresh
    setTimeout(() => {
      router.push(targetPath);
      router.refresh();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex overflow-hidden">
      
      {/* 1️⃣ LEFT PANEL — BRAND + TRUST (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#0F172A] relative flex-col justify-between p-12 border-r border-white/5">
         
         {/* Background Visuals */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0F172A] to-[#0F172A]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 bg-repeat mix-blend-overlay"></div>
         
         {/* Abstract Network Graphic */}
         <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 Q 50 50 100 0" stroke="url(#grad1)" strokeWidth="0.2" fill="none" />
               <path d="M0 80 Q 50 50 100 20" stroke="url(#grad1)" strokeWidth="0.2" fill="none" />
               <path d="M0 60 Q 50 50 100 40" stroke="url(#grad1)" strokeWidth="0.2" fill="none" />
               <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" style={{stopColor:"#3B82F6", stopOpacity:0}} />
                   <stop offset="50%" style={{stopColor:"#3B82F6", stopOpacity:0.5}} />
                   <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:0}} />
                 </linearGradient>
               </defs>
            </svg>
         </div>

         {/* Brand Header */}
         <div className="relative z-10">
            <div onClick={() => router.push("/")} className="text-2xl font-black italic tracking-tighter flex items-center gap-2 cursor-pointer mb-2">
               <span className="bg-white text-black px-2 py-0.5 rounded">R</span>
               REVLET
            </div>
            <p className="text-blue-400 font-medium tracking-wide">Fleet operations. Connected.</p>
         </div>

         {/* Trust Footer */}
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
               <IconShield /> Secure Enterprise Access
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
               Authorized personnel only. All activity is logged and audited for compliance.
            </p>
         </div>
      </div>

      {/* 2️⃣ RIGHT PANEL — LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
         
         <div className="w-full max-w-[400px]">
            {/* Header */}
            <div className="mb-10">
               <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Log in to Revlet</h1>
               <p className="text-slate-400">Access your fleet operations platform.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
               
               {/* Email */}
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Work Email</label>
                  <div className="relative group">
                     <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-white transition-colors">
                        <IconMail />
                     </div>
                     <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 h-12 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder:text-slate-600"
                     />
                  </div>
               </div>

               {/* Password */}
               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <label className="text-xs font-semibold text-slate-300">Password</label>
                     <span className="text-xs text-blue-500 hover:text-blue-400 cursor-pointer font-medium">Forgot password?</span>
                  </div>
                  <div className="relative group">
                     <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-white transition-colors">
                        <IconLock />
                     </div>
                     <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-12 h-12 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder:text-slate-600"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
                     >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                     </button>
                  </div>
               </div>

               {/* Error Message */}
               {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium p-3 rounded-lg flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     {error}
                  </div>
               )}

               {/* Submit */}
               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-lg shadow-lg shadow-blue-900/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {loading ? (
                     <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                     "Log In"
                  )}
               </button>

               {/* Enterprise SSO Divider */}
               <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-[#0B0F19] px-2 text-slate-600 font-semibold">Enterprise Access</span>
                  </div>
               </div>

               <button type="button" disabled className="w-full bg-slate-900 border border-slate-700 text-slate-400 font-medium h-12 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition cursor-not-allowed opacity-60">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#EA4335"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.52 1 3.8 3.55 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#34A853"/><path d="M12 23c2.97 0 5.46-1.01 7.28-2.69l-3.54-2.87c-.99.66-2.23 1.06-3.74 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.8 20.45 7.52 23 12 23z" fill="#34A853"/><path d="M23 12c0-.66-.12-1.32-.27-1.96H12v3.75h6.35c-.53 2.57-2.73 4.26-5.35 4.26-2.5 0-4.63-1.5-5.71-3.75l-3.02 2.44C6.03 19.66 9.35 21.38 13.07 21.38c5.44 0 9.87-3.93 10.61-9.38H23z" fill="#4285F4"/></svg>
                  Sign in with SSO
               </button>

            </form>

            {/* Footer */}
            <div className="mt-12 flex justify-center gap-6 text-xs text-slate-500 font-medium">
               <span className="hover:text-slate-300 cursor-pointer">Contact Support</span>
               <span className="w-px h-3 bg-slate-800"></span>
               <span className="hover:text-slate-300 cursor-pointer">Privacy & Security</span>
            </div>
         </div>

      </div>
    </div>
  );
}