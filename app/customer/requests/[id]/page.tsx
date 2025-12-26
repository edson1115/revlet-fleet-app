"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip"; 

function formatTitle(t: string) {
  if (!t) return "Service Request";
  return t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function CustomerRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customer/requests/${id}`)
      .then(res => res.json())
      .then(js => setRequest(js.request))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!request) return <div className="p-10 text-center">Request not found.</div>;

  const v = request.vehicle;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <button onClick={() => router.push("/customer/requests")} className="hover:text-black hover:underline">&larr; Back to List</button>
                <span>/</span>
                <span>Request #{request.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">
                {formatTitle(request.service_title)}
            </h1>
        </div>
        <TeslaStatusChip status={request.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COL */}
        <div className="lg:col-span-2 space-y-6">
            <TeslaSection label="Vehicle Information">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xl font-bold">{v?.year} {v?.make} {v?.model}</div>
                        <div className="text-sm text-gray-500 mt-1">VIN: {v?.vin || "—"}</div>
                    </div>
                    <div className="text-right">
                         <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono font-bold">
                            {v?.plate || "NO PLATE"}
                         </span>
                    </div>
                </div>
            </TeslaSection>

            <TeslaSection label="Service Notes">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800">
                    {request.service_description || "No notes."}
                </div>
            </TeslaSection>
        </div>

        {/* RIGHT COL: TIMELINE */}
        <div className="space-y-6">
            <TeslaSection label="Status Timeline">
                <div className="relative pl-2 space-y-6">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                    {["NEW", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].map((step, i) => {
                        const isPast = ["NEW", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].indexOf(request.status) >= i;
                        return (
                            <div key={step} className="relative flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full z-10 border-2 ${isPast ? 'bg-black border-black' : 'bg-white border-gray-300'}`} />
                                <span className={`text-xs font-bold tracking-wider ${isPast ? 'text-black' : 'text-gray-400'}`}>
                                    {step.replace(/_/g, " ")}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </TeslaSection>
        </div>
      </div>
    </div>
  );
}