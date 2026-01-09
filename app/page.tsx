"use client";

import { useRouter } from "next/navigation";

// --- ICONS ---
const IconBolt = () => <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IconCheck = () => <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconMobile = () => <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-black/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
           <div className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
              <span className="bg-white text-black px-2 py-0.5 rounded">R</span>
              REVLET
           </div>
           <div className="flex gap-4">
              <button 
                onClick={() => router.push("/login")}
                className="text-sm font-bold text-gray-300 hover:text-white transition"
              >
                Log In
              </button>
              <button 
                onClick={() => router.push("/login")}
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition"
              >
                Get Started
              </button>
           </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-20 pb-32 overflow-hidden">
         {/* Background Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] -z-10"></div>

         <div className="max-w-5xl mx-auto text-center px-6">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-xs font-bold tracking-wide uppercase text-gray-300">v2.0 Now Live</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-tight mb-8">
               Fleet Service <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Reinvented.</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
               The all-in-one operating system for modern auto shops. 
               Intake, Inventory, Tech Dispatch, and Invoicing—seamlessly connected.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-4">
               <button 
                 onClick={() => router.push("/office")}
                 className="bg-white text-black px-8 py-4 rounded-xl text-lg font-bold hover:scale-105 transition transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
               >
                 Launch Office Dashboard
               </button>
               <button 
                 onClick={() => router.push("/tech")}
                 className="bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/20 transition backdrop-blur-sm"
               >
                 View Tech App
               </button>
            </div>
         </div>
      </header>

      {/* FEATURES GRID */}
      <section className="py-24 border-t border-white/10 bg-zinc-900/50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               
               {/* CARD 1 */}
               <div className="p-8 rounded-3xl bg-black border border-white/10 hover:border-purple-500/50 transition group">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                     <IconBolt />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Instant Invoicing</h3>
                  <p className="text-gray-400 leading-relaxed">
                     Turn work orders into paid invoices in seconds. Auto-calculate taxes, labor, and parts markup instantly.
                  </p>
               </div>

               {/* CARD 2 */}
               <div className="p-8 rounded-3xl bg-black border border-white/10 hover:border-green-500/50 transition group">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                     <IconCheck />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Inventory Sync</h3>
                  <p className="text-gray-400 leading-relaxed">
                     Never run out of oil filters again. Real-time deduction when techs close jobs, with low-stock alerts.
                  </p>
               </div>

               {/* CARD 3 */}
               <div className="p-8 rounded-3xl bg-black border border-white/10 hover:border-blue-500/50 transition group">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                     <IconMobile />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Tech Mobile App</h3>
                  <p className="text-gray-400 leading-relaxed">
                     Give your technicians a purpose-built tool. VIN scanning, photo uploads, and digital inspections.
                  </p>
               </div>

            </div>
         </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm">
         <p>&copy; {new Date().getFullYear()} Venture Marketing Partners. All rights reserved.</p>
      </footer>

    </div>
  );
}