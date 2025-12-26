"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Needed for navigation
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaCustomerRequestRow } from "@/components/tesla/customer/TeslaCustomerRequestRow";

function formatTitle(t: string) {
  if (!t) return "Service Request";
  return t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function CustomerRequestsClient() {
  const router = useRouter(); // ✅ Init Router
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // ✅ cache: "no-store" fixes the dashboard lag issue too
        const res = await fetch("/api/customer/requests", { cache: "no-store" });
        const js = await res.json();
        setRows(js.rows ?? []); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER WITH DASHBOARD LINK */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
           {/* ✅ Added Dashboard Link */}
           <button onClick={() => router.push("/customer")} className="text-xs font-bold text-gray-400 hover:text-black mb-1">
             &larr; Back to Dashboard
           </button>
          <h1 className="text-3xl font-bold tracking-tight text-black">My Requests</h1>
        </div>
        <button 
            onClick={() => router.push("/customer/requests/new")}
            className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg"
        >
            + New Request
        </button>
      </div>

      {/* REQUEST LIST */}
      <TeslaSection label="Active & Past Requests">
        <div className="bg-white rounded-xl divide-y border border-gray-100 shadow-sm overflow-hidden">
          {loading && (
            <div className="text-center text-gray-500 py-12">Loading history...</div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              No service requests yet.
            </div>
          )}

          {rows.map((r) => (
            <div 
                key={r.id}
                onClick={() => router.push(`/customer/requests/${r.id}`)} // ✅ CLICKABLE ROW
                className="cursor-pointer hover:bg-gray-50 transition block"
            >
                <TeslaCustomerRequestRow 
                req={{
                    ...r,
                    service_title: formatTitle(r.service_title)
                }} 
                />
            </div>
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}