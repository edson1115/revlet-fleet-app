"use client";

import { use, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function CustomerPortal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles(*),
        request_images(*),
        request_parts(*)
      `)
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setRequest(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-20 text-center">Loading Secure Portal...</div>;
  if (!request) return <div className="p-20 text-center">Request Not Found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-blue-100">
      {/* Brand Header */}
      <div className="bg-black text-white p-6 flex justify-between items-center">
        <div className="font-black italic text-xl tracking-tighter">REVLET <span className="text-blue-500">FLEET</span></div>
        <div className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded uppercase tracking-widest">Secure Link</div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Status Header */}
        <div className="text-center py-6">
           <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Service Status</div>
           <h1 className="text-4xl font-black text-gray-900 uppercase italic italic leading-none">{request.status.replace("_", " ")}</h1>
        </div>

        {/* Vehicle Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none">{request.vehicle?.year} {request.vehicle?.model}</h2>
              <p className="text-sm text-gray-400 mt-1 font-mono uppercase tracking-tighter">{request.vehicle?.vin}</p>
            </div>
            <div className="bg-black text-white px-3 py-1.5 rounded-xl font-mono font-bold">{request.plate || request.vehicle?.plate}</div>
          </div>
          <div className="pt-4 border-t border-gray-50 text-sm font-bold text-gray-600">{request.service_title}</div>
        </div>

        {/* Documentation Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-900 px-1">Service Documentation</h3>
          
          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-3">
            {request.request_images?.map((img: any, i: number) => (
              <div key={i} className="aspect-video bg-gray-200 rounded-2xl overflow-hidden shadow-sm border border-white">
                <img src={img.image_url} className="w-full h-full object-cover" alt="Condition" />
              </div>
            ))}
          </div>

          {/* Tech Notes */}
          {request.technician_notes && (
            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Technician Findings</span>
              <p className="mt-2 text-lg font-medium leading-relaxed italic">"{request.technician_notes}"</p>
            </div>
          )}
        </div>

        {/* Support Footer */}
        <div className="text-center pt-10 border-t border-gray-200">
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Questions? Contact Revlet Fleet Support</p>
        </div>
      </div>
    </div>
  );
}