"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { convertLeadToCustomer } from "@/app/actions/admin";
import { format, parseISO } from "date-fns";

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  notes: string;
  address: string;
  visit_date: string;
  inspection_data: any;
  sales_rep_id: string; 
};

export default function AdminLeadsInbox() {
  const [inbox, setInbox] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leads marked "ONBOARDING" or "SENT_TO_OFFICE"
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchInbox = async () => {
        const { data } = await supabase
            .from("sales_leads")
            .select("*")
            .in("customer_status", ["ONBOARDING"]) // Only pending ones
            .order("visit_date", { ascending: false });
        
        if (data) setInbox(data);
        setLoading(false);
    };

    fetchInbox();
  }, []);

  const handleApprove = async (lead: Lead) => {
      if(!confirm(`Are you sure you want to onboard ${lead.company_name} as a new customer?`)) return;

      const result = await convertLeadToCustomer(lead);

      if (result.success) {
          alert(`✅ ${lead.company_name} is now an Official Customer!`);
          // Remove from local list instantly
          setInbox(inbox.filter(i => i.id !== lead.id));
      } else {
          alert("Error converting lead: " + result.error);
      }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Lead Inbox</h1>
            <p className="text-gray-500">Approve new customers sent by Sales Team.</p>
          </div>
          <div className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-lg text-sm">
              {inbox.length} Pending Approvals
          </div>
      </div>

      {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Loading Inbox...</div>
      ) : inbox.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="text-4xl mb-2">📭</div>
              <h3 className="text-gray-900 font-bold">All caught up!</h3>
              <p className="text-gray-500 text-sm">No new customers waiting for approval.</p>
          </div>
      ) : (
          <div className="space-y-4">
              {inbox.map(lead => (
                  <div key={lead.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-start">
                      
                      {/* LEAD INFO */}
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">{lead.company_name}</h3>
                              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">New Lead</span>
                              <span className="text-xs text-gray-400 ml-auto md:ml-2">{format(parseISO(lead.visit_date), 'MMM d, h:mm a')}</span>
                          </div>
                          
                          <div className="text-sm text-gray-500 mb-3 flex flex-wrap gap-3">
                             {lead.contact_name && <span>👤 {lead.contact_name}</span>}
                             {lead.phone && <span>📞 {lead.phone}</span>}
                             {lead.address && <span>📍 {lead.address}</span>}
                          </div>

                          {/* SWEEP DATA (RED BADGES) */}
                          {lead.inspection_data && (
                              <div className="mb-3">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sweep Inspection Findings:</div>
                                  <div className="flex flex-wrap gap-2">
                                      {Object.entries(lead.inspection_data).map(([key, val]) => (
                                          val ? <span key={key} className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm uppercase">⚠️ {key}</span> : null
                                      ))}
                                  </div>
                              </div>
                          )}

                          {lead.notes && (
                              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic border-l-4 border-green-400">
                                  "Sales Rep Note: {lead.notes}"
                              </div>
                          )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex flex-col gap-2 w-full md:w-48">
                          <button 
                             onClick={() => handleApprove(lead)}
                             className="w-full px-4 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg text-sm flex items-center gap-2 justify-center"
                          >
                             <span>🚀</span> Onboard Now
                          </button>
                          <button 
                             onClick={() => alert("Mark as reviewed but keep in inbox?")}
                             className="w-full px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 text-sm"
                          >
                             Hold / Review
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}