"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS (Inline for zero dependencies) ---
const IconCheck = () => <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconUser = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconCommand = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconSmartphone = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const IconChart = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>;
const IconTruck = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-600 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-black/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
           <div className="text-xl font-black italic tracking-tighter flex items-center gap-2 select-none">
              <span className="bg-white text-black px-2 py-0.5 rounded-sm">R</span>
              REVLET
           </div>
           <div className="flex gap-4">
              <button onClick={() => router.push("/login")} className="text-sm font-bold text-zinc-400 hover:text-white transition">
                Log In
              </button>
              <button onClick={() => router.push("/login")} className="bg-white text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition">
                Get Started
              </button>
           </div>
        </div>
      </nav>

      {/* --- 1. HERO SECTION (Above the Fold) --- */}
      <header className="relative pt-24 pb-20 overflow-hidden">
         {/* Background Grid Ambience */}
         <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none"></div>
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 rounded-full blur-[120px] -z-10"></div>

         <div className="max-w-5xl mx-auto text-center px-6 relative z-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8">
               Run Your Entire Fleet Service Operation — <br className="hidden md:block"/>
               <span className="text-zinc-500">In One Platform.</span>
            </h1>
            
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
               Revlet connects fleet requests, dispatch, technicians, parts, photos, and invoicing into one real-time workflow.
            </p>

            {/* CTAs mapped to your App Routes so you can still use them */}
            <div className="flex flex-col md:flex-row justify-center gap-4">
               <button onClick={() => router.push("/office")} className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-500 transition shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]">
                 Request a Demo
               </button>
               <button onClick={() => router.push("/tech")} className="bg-zinc-900 border border-zinc-700 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-zinc-800 transition">
                 See How It Works
               </button>
            </div>
            <p className="mt-4 text-xs text-zinc-500 font-mono">
                DEV NOTE: "Request Demo" launches /office. "See How It Works" launches /tech.
            </p>
         </div>
      </header>

      {/* --- 2. TRUST & PROOF STRIP --- */}
      <section className="border-y border-white/5 bg-zinc-950 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">
                Trusted by High-Volume Fleet Operators & Enterprise Partners
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale">
                {/* Text-based Logos to avoid image dependencies */}
                <span className="text-xl font-black font-serif"></span>
                <span className="text-xl font-black font-sans tracking-tight"><span className="font-light"></span></span>
                <span className="text-xl font-black font-mono"></span>
                <span className="text-xl font-black italic"></span>
                <span className="text-xl font-black"></span>
            </div>
        </div>
      </section>

      {/* --- 3. ROLE-BASED PLATFORM OVERVIEW --- */}
      <section className="py-24 px-6 bg-black">
         <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center">
                <h2 className="text-4xl font-black tracking-tight mb-4">One Platform. Built for Every Role.</h2>
                <p className="text-zinc-400">Strict permissions, dedicated workflows, shared intelligence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Customer Portal */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900 transition group">
                    <div className="w-12 h-12 bg-purple-900/30 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                        <IconUser />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Customer Portal</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                        <li className="flex gap-2"><span className="text-purple-500">•</span> Submit requests</li>
                        <li className="flex gap-2"><span className="text-purple-500">•</span> Track status live</li>
                        <li className="flex gap-2"><span className="text-purple-500">•</span> View service history</li>
                    </ul>
                </div>

                {/* Dispatch Console */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900 transition group">
                    <div className="w-12 h-12 bg-orange-900/30 text-orange-400 rounded-xl flex items-center justify-center mb-6">
                        <IconCommand />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Dispatch Console</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                        <li className="flex gap-2"><span className="text-orange-500">•</span> Central request queue</li>
                        <li className="flex gap-2"><span className="text-orange-500">•</span> Assign & route techs</li>
                        <li className="flex gap-2"><span className="text-orange-500">•</span> Priority control</li>
                    </ul>
                </div>

                {/* Technician App */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900 transition group">
                    <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                        <IconSmartphone />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Technician Mobile</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                        <li className="flex gap-2"><span className="text-blue-500">•</span> Job list by route</li>
                        <li className="flex gap-2"><span className="text-blue-500">•</span> VIN scan & Photos</li>
                        <li className="flex gap-2"><span className="text-blue-500">•</span> Parts tracking</li>
                    </ul>
                </div>

                {/* Admin & Reporting */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:bg-zinc-900 transition group">
                    <div className="w-12 h-12 bg-green-900/30 text-green-400 rounded-xl flex items-center justify-center mb-6">
                        <IconChart />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Admin & Audit</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                        <li className="flex gap-2"><span className="text-green-500">•</span> Fleet analytics</li>
                        <li className="flex gap-2"><span className="text-green-500">•</span> Invoice automated</li>
                        <li className="flex gap-2"><span className="text-green-500">•</span> Audit-ready logs</li>
                    </ul>
                </div>

            </div>
         </div>
      </section>

      {/* --- 4. WORKFLOW SECTION (Tesla-style) --- */}
      <section className="py-24 px-6 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">From Request to Invoice — Without the Chaos</h2>
                <p className="text-zinc-400">Every step is tracked, timestamped, and visible to the right people — automatically.</p>
            </div>

            {/* Horizontal Timeline Visualizer */}
            <div className="relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                    {[
                        { step: "01", title: "Request", desc: "Customer submits via portal" },
                        { step: "02", title: "Dispatch", desc: "Office assigns tech & time" },
                        { step: "03", title: "En Route", desc: "Tech navigates to site" },
                        { step: "04", title: "Service", desc: "Photos, Parts, Inspect" },
                        { step: "05", title: "Invoice", desc: "Auto-generated & sent" },
                    ].map((item, i) => (
                        <div key={i} className="bg-black border border-zinc-800 p-6 rounded-xl flex flex-col items-center text-center shadow-xl hover:border-zinc-600 transition">
                            <div className="text-xs font-black text-zinc-600 uppercase mb-2">Step {item.step}</div>
                            <div className="text-lg font-bold text-white mb-1">{item.title}</div>
                            <div className="text-sm text-zinc-500 leading-tight">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* --- 5. WHY REVLET / DIFFERENTIATION --- */}
      <section className="py-24 px-6 bg-black">
         <div className="max-w-6xl mx-auto bg-zinc-900/30 rounded-3xl p-8 md:p-16 border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-6">Built for Operations.<br/>Not just Billing.</h2>
                    <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                        Most fleet software is just a fancy invoice generator. Revlet is an operational control tower designed by people who know what it's like to manage thousands of assets.
                    </p>
                    <button className="text-white font-bold border-b border-white hover:text-zinc-300 transition">Read our manifest &rarr;</button>
                </div>
                <div className="space-y-4">
                    {[
                        "Built for mobile + in-shop operations",
                        "Designed for real fleet scale, not single shops",
                        "Reduces Slack, texts, and spreadsheet chaos",
                        "Audit-ready logs, photos, and timelines",
                        "Designed by operators — not generic SaaS"
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="mt-1"><IconCheck /></div>
                            <span className="text-zinc-300 font-medium">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      </section>

      {/* --- 6. INDUSTRIES --- */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight mb-10 text-center">Built for High-Demand Fleets</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Logistics & Delivery", sub: "Last-mile DSPs" },
                    { title: "Rental & Mobility", sub: "High turnover fleets" },
                    { title: "Municipal & Gov", sub: "Compliance heavy" },
                    { title: "Trades & Service", sub: "HVAC, Plumbing, EMS" }
                ].map((ind, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-white/20 transition cursor-default">
                        <IconTruck />
                        <h3 className="text-lg font-bold text-white mt-4">{ind.title}</h3>
                        <p className="text-sm text-zinc-500">{ind.sub}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- 7. FINAL CTA --- */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8">Ready to Modernize Your Fleet?</h2>
            <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
               <button onClick={() => router.push("/login")} className="bg-white text-black px-10 py-4 rounded-xl text-lg font-bold hover:bg-zinc-200 transition">
                 Schedule a Demo
               </button>
               <button onClick={() => router.push("/login")} className="bg-transparent border border-zinc-700 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-zinc-800 transition">
                 Talk to Sales
               </button>
            </div>
            <p className="text-sm text-zinc-500 font-medium">No contracts. No gimmicks. Built for real operations.</p>
        </div>
      </section>

      {/* --- 8. FOOTER --- */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8 px-6">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
                <div className="text-xl font-black italic tracking-tighter flex items-center gap-2 mb-4">
                    <span className="bg-white text-black px-2 py-0.5 rounded-sm">R</span>
                    REVLET
                </div>
                <p className="text-zinc-500 text-sm max-w-xs">
                    The operating system for modern fleet service.
                </p>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li className="hover:text-white cursor-pointer">Dispatch</li>
                    <li className="hover:text-white cursor-pointer">Invoicing</li>
                    <li className="hover:text-white cursor-pointer">Mobile App</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li className="hover:text-white cursor-pointer">About</li>
                    <li className="hover:text-white cursor-pointer">Careers</li>
                    <li className="hover:text-white cursor-pointer">Contact</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-zinc-500">
                    <li className="hover:text-white cursor-pointer">Privacy</li>
                    <li className="hover:text-white cursor-pointer">Terms</li>
                    <li className="hover:text-white cursor-pointer">Security</li>
                </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 text-center md:text-left text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Venture Marketing Partners. All rights reserved.
         </div>
      </footer>

    </div>
  );
}