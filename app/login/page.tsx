"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// --- ICONS ---
const IconLock = () => <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const IconMail = () => <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconArrowRight = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;

export default function LoginPage() {
  const router = useRouter();

  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      name: "sb-revlet-auth-token",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    // Adding this helps Supabase keep LocalStorage and Cookies in sync
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    }
  }
);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role;

    console.log("REVLET AUTH: Authenticated as", role);

    // 🚥 THE TRAFFIC CONTROLLER
    let targetPath = '/office'; // Default fallback
    
    if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      targetPath = '/admin/users';
    } else if (role === 'TECH' || role === 'TECHNICIAN') {
      targetPath = '/tech';
    } else if (role === 'CUSTOMER') {
      targetPath = '/customer'; // 👈 Sends customers to app/customer/page.tsx
    }

    router.prefetch(targetPath);

    // ⏳ Cookie Settlement Delay
    setTimeout(() => {
      router.push(targetPath);
      router.refresh();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <nav className="p-6 absolute top-0 left-0 w-full z-10 flex justify-between items-center">
        <div onClick={() => router.push("/")} className="text-xl font-black italic tracking-tighter flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
          <span className="bg-white text-black px-2 py-0.5 rounded">R</span>
          REVLET
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black mb-2 tracking-tight uppercase italic leading-none">Identity Access</h1>
            <p className="text-gray-500 font-medium">Secure login for Revlet Fleet OS.</p>
          </div>

          <div className="bg-zinc-900/50 border border-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">
                    <IconMail />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-black/50 border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder:text-zinc-700 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">
                    <IconLock />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder:text-zinc-700 font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase p-4 rounded-2xl text-center tracking-widest">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black text-lg py-5 rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4 shadow-xl disabled:opacity-50"
              >
                {loading ? "Authenticating..." : <>Log In <IconArrowRight /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}