"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ANIMATED SECTION COMPONENT ---
const ScrollSection = ({ 
    children, 
    dir = "left", 
    delay = 0 
}: { 
    children: React.ReactNode, 
    dir?: "left" | "right" | "up", 
    delay?: number 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => setIsVisible(entry.isIntersecting));
        });
        if (domRef.current) observer.observe(domRef.current);
        return () => observer.disconnect();
    }, []);

    const translateClass = dir === "left" ? "-translate-x-20" : dir === "right" ? "translate-x-20" : "translate-y-20";

    return (
        <div
            ref={domRef}
            style={{ transitionDelay: `${delay}ms` }}
            className={clsx(
                "transition-all duration-1000 ease-out transform opacity-0",
                isVisible ? "opacity-100 translate-x-0 translate-y-0" : translateClass
            )}
        >
            {children}
        </div>
    );
};

export default function TechPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-blue-600">
      
      {/* --- NAV --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
             <div onClick={() => router.push("/")} className="text-xl font-black italic tracking-tighter cursor-pointer flex items-center gap-2">
                 <span className="bg-white text-black px-2 py-0.5 rounded-sm">R</span> REVLET
             </div>
             <button onClick={() => router.push("/login")} className="bg-white text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition">
                Get Started
             </button>
         </div>
      </nav>

      {/* --- HERO --- */}
      <section className="h-screen flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
          
          <ScrollSection dir="up">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-center mb-6 relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-600">
                THE STAR<br/>METHOD
            </h1>
          </ScrollSection>
          
          <ScrollSection dir="up" delay={200}>
            <p className="text-xl text-zinc-400 max-w-2xl text-center relative z-10 px-6">
                How Revlet transforms chaos into calculated precision using our proprietary 4-step operational workflow.
            </p>
          </ScrollSection>

          <div className="absolute bottom-10 animate-bounce text-zinc-500">
             Scroll to Explore ↓
          </div>
      </section>

      {/* --- THE JOURNEY --- */}
      <div className="max-w-7xl mx-auto px-6 pb-40 relative">
          
          {/* THE SPINE (Glowing Line) */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-blue-600 to-transparent opacity-30"></div>

          {/* --- STEP 1: SITUATION --- */}
          <div className="flex flex-col md:flex-row items-center min-h-[80vh] py-20 relative">
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.8)] z-10"></div>
              
              <div className="w-full md:w-1/2 md:pr-16 md:text-right pl-12 md:pl-0 order-2 md:order-1">
                  <ScrollSection dir="left">
                      <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-4">01. Situation</h2>
                      <h3 className="text-4xl md:text-5xl font-bold mb-6">The Chaos of Scale.</h3>
                      <p className="text-zinc-400 text-lg leading-relaxed">
                          Vehicles break down. Drivers don't report it until it's too late. Your inbox is flooded with texts, random photos, and paper invoices. You don't know your true cost per mile.
                      </p>
                  </ScrollSection>
              </div>
              <div className="w-full md:w-1/2 md:pl-16 pl-12 mt-8 md:mt-0 order-1 md:order-2">
                  <ScrollSection dir="right">
                      {/* VIDEO 1: CHAOS */}
                      <div className="aspect-video rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                          <video 
                              src="/tour/chaos.mp4" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                              // ⚠️ ADDED: scale-[1.15] to crop watermark
                              className="w-full h-full object-cover opacity-80 scale-[1.15]" 
                          />
                          {/* Overlay for cinematic effect */}
                          <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay pointer-events-none"></div>
                      </div>
                  </ScrollSection>
              </div>
          </div>

          {/* --- STEP 2: TARGET --- */}
          <div className="flex flex-col md:flex-row items-center min-h-[80vh] py-20 relative">
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"></div>
              
              <div className="w-full md:w-1/2 md:pr-16 md:text-right pl-12 md:pl-0 order-1">
                   <ScrollSection dir="left">
                      {/* VIDEO 2: DISPATCH */}
                      <div className="aspect-video rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                          <video 
                              src="/tour/dispatch.mp4" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                              // ⚠️ ADDED: scale-[1.15] to crop watermark
                              className="w-full h-full object-cover scale-[1.15]"
                          />
                           <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay pointer-events-none"></div>
                      </div>
                  </ScrollSection>
              </div>
              <div className="w-full md:w-1/2 md:pl-16 pl-12 mt-8 md:mt-0 order-2">
                  <ScrollSection dir="right">
                      <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-4">02. Target</h2>
                      <h3 className="text-4xl md:text-5xl font-bold mb-6">Centralized Command.</h3>
                      <p className="text-zinc-400 text-lg leading-relaxed">
                          Revlet creates a single source of truth. Service requests flow into a central "Dispatch Console" where you assign the right tech, to the right truck, at the right time.
                      </p>
                  </ScrollSection>
              </div>
          </div>

          {/* --- STEP 3: ACTION --- */}
          <div className="flex flex-col md:flex-row items-center min-h-[80vh] py-20 relative">
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)] z-10"></div>
              
              <div className="w-full md:w-1/2 md:pr-16 md:text-right pl-12 md:pl-0 order-2 md:order-1">
                  <ScrollSection dir="left">
                      <h2 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">03. Action</h2>
                      <h3 className="text-4xl md:text-5xl font-bold mb-6">Mobile Execution.</h3>
                      <p className="text-zinc-400 text-lg leading-relaxed">
                          Technicians receive the job on their phone. They scan the VIN. They take photos of the damage. They log parts used. Nothing is handwritten. Nothing is lost.
                      </p>
                  </ScrollSection>
              </div>
              <div className="w-full md:w-1/2 md:pl-16 pl-12 mt-8 md:mt-0 order-1 md:order-2">
                  <ScrollSection dir="right">
                      {/* VIDEO 3: MOBILE APP */}
                      <div className="aspect-[9/16] w-2/3 mx-auto rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl bg-black">
                          <div className="absolute inset-x-0 top-0 h-6 bg-black/80 z-20 backdrop-blur-sm"></div> {/* Notch */}
                          <video 
                              src="/tour/mobile.mp4" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                              // ⚠️ ADDED: scale-[1.15] to crop watermark
                              className="w-full h-full object-cover scale-[1.15]"
                          />
                      </div>
                  </ScrollSection>
              </div>
          </div>

           {/* --- STEP 4: RESULT --- */}
           <div className="flex flex-col md:flex-row items-center min-h-[80vh] py-20 relative">
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] z-10"></div>
              
              <div className="w-full md:w-1/2 md:pr-16 md:text-right pl-12 md:pl-0 order-1">
                   <ScrollSection dir="left">
                      {/* VIDEO 4: DATA */}
                      <div className="aspect-video rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                          <video 
                              src="/tour/data.mp4" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline 
                              // ⚠️ ADDED: scale-[1.15] to crop watermark
                              className="w-full h-full object-cover scale-[1.15]"
                          />
                      </div>
                  </ScrollSection>
              </div>
              <div className="w-full md:w-1/2 md:pl-16 pl-12 mt-8 md:mt-0 order-2">
                  <ScrollSection dir="right">
                      <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">04. Result</h2>
                      <h3 className="text-4xl md:text-5xl font-bold mb-6">Automated Intelligence.</h3>
                      <p className="text-zinc-400 text-lg leading-relaxed">
                          The invoice is auto-generated. The asset history is updated. You see exactly how much that vehicle is costing you. Chaos becomes data.
                      </p>
                  </ScrollSection>
              </div>
          </div>

      </div>

      {/* --- FOOTER CTA --- */}
      <section className="py-24 text-center">
          <ScrollSection dir="up">
              <h2 className="text-4xl font-black mb-8">Ready to start the cycle?</h2>
              <button onClick={() => router.push("/login")} className="bg-white text-black px-10 py-5 rounded-xl text-xl font-bold hover:scale-105 transition duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                  Get Access Now
              </button>
          </ScrollSection>
      </section>

    </div>
  );
}