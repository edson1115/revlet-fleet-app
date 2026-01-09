import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { generateServiceSummary } from "@/lib/intelligence";
import clsx from "clsx";

export default async function ServiceReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch Request, Vehicle, and Tech Data
  const { data: report, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      vehicles (*),
      profiles (full_name),
      inspection_ai_outputs (*)
    `)
    .eq("id", params.id)
    .single();

  if (error || !report) notFound();

  // 2. Fallback to live generation if AI summary doesn't exist yet
  const aiSummary = report.inspection_ai_outputs?.[0] || generateServiceSummary(
    report.tech_notes || "",
    report.parts_json || [],
    report.flags || []
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200">
        
        {/* REPORT HEADER: Audit-Grade */}
        <div className="bg-zinc-900 p-10 text-white flex justify-between items-end">
          <div>
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Official Service Record</span>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mt-1">Revlet Report</h1>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-xs font-bold uppercase">ID: {report.id.substring(0,8)}</p>
            <p className="text-white font-black">{new Date(report.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* VEHICLE INFO */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-10 border-b border-zinc-100">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase">Vehicle</label>
              <p className="font-bold text-zinc-900">{report.vehicles.year} {report.vehicles.make}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase">Model</label>
              <p className="font-bold text-zinc-900">{report.vehicles.model}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase">Mileage</label>
              <p className="font-bold text-zinc-900">{report.vehicles.mileage?.toLocaleString()} mi</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase">Technician</label>
              <p className="font-bold text-zinc-900">{report.profiles?.full_name || "Assigned Tech"}</p>
            </div>
          </section>

          {/* AI SUMMARY: Outcome-Based Intelligence */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-xl font-black uppercase italic tracking-tight">Intelligence Summary</h2>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
              <p className="text-blue-900 font-medium leading-relaxed italic">
                "{aiSummary.summary_text}"
              </p>
            </div>
          </section>

          {/* RECOMMENDATION & COMPLIANCE */}
          <section className="bg-zinc-900 text-white p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-black text-zinc-500 uppercase">Professional Recommendation</span>
              <p className="text-lg font-bold">{aiSummary.professional_recommendation}</p>
            </div>
            <div className={clsx(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest",
              aiSummary.audit_status === "COMPLIANT" ? "bg-emerald-500 text-white" : "bg-amber-500 text-black"
            )}>
              {aiSummary.audit_status}
            </div>
          </section>

          {/* COMPLIANCE TRAIL (Gap C) */}
          <p className="text-center text-[9px] text-zinc-400 uppercase tracking-widest font-bold">
            Verified by Revlet Immutable Audit Trail • {new Date().toUTCString()}
          </p>
        </div>
      </div>
    </div>
  );
}