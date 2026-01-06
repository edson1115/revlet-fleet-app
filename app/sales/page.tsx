"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { addLead } from "@/app/actions/sales";
import { format, isSameDay, parseISO } from "date-fns";
import MapWrapper from "./MapWrapper";
import Calendar from "react-calendar"; 
import "react-calendar/dist/Calendar.css"; // Default styling

type Lead = {
  id: string;
  company_name: string;
  address: string;
  contact_name: string;
  visit_type: string;
  notes: string;
  visit_date: string;
  status: string;
  customer_status: string;
  recurrence_rule: string;
  inspection_data: any;
  lat: number;
  lng: number;
};

export default function SalesCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<"form" | "map" | "calendar">("form"); // Added Calendar
  const [date, setDate] = useState<Date>(new Date()); // Calendar Date
  const [visitType, setVisitType] = useState("Cold Call");
  const [showSuccess, setShowSuccess] = useState(false);
  const [debugMsg, setDebugMsg] = useState("");

  const [inspectionItems, setInspectionItems] = useState({
      windshield: false, wipers: false, tires: false, brakes: false, 
      oil: false, leaks: false, body: false, doors: false
  });
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [stats, setStats] = useState({ coldCallPct: 0, dailyVisits: 0 });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const fetchLeads = useCallback(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    setDebugMsg(`User: ${user?.email}`);

    const { data, error } = await supabase
      .from("sales_leads")
      .select("*")
      .order("visit_date", { ascending: false });

    if (data) {
       const parsedData = data.map(l => {
          let lat = 32.7767, lng = -96.7970;
          return { ...l, lat, lng };
       });
       setLeads(parsedData);
       analyzeData(parsedData);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // --- AI LOGIC ---
  const analyzeData = (data: Lead[]) => {
      const today = new Date();
      const suggestions = [];

      // 1. Check for Recurring Patterns (Simple AI)
      // If a lead was visited exactly 7 days ago, suggest it today
      data.forEach(l => {
         if (l.recurrence_rule === 'weekly') {
             const lastVisit = parseISO(l.visit_date);
             const daysDiff = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));
             if (daysDiff >= 7 && daysDiff < 8) {
                 suggestions.push(`📅 It's been a week since you visited ${l.company_name}. Time for a follow-up?`);
             }
         }
      });

      // 2. Check for "Stalled" Deals
      const counts: Record<string, number> = {};
      data.forEach(l => { counts[l.company_name] = (counts[l.company_name] || 0) + 1 });
      Object.entries(counts).forEach(([company, count]) => {
          const recent = data.find(l => l.company_name === company);
          if (count > 2 && recent?.customer_status === "COLD") {
              suggestions.push(`🤖 You've visited ${company} ${count} times with no deal. Try offering a discount?`);
          }
      });

      setAiSuggestions(suggestions);

      // Stats
      const todayVisits = data.filter(l => isSameDay(parseISO(l.visit_date), today));
      const coldCalls = todayVisits.filter(l => l.visit_type === "Cold Call").length;
      setStats({
          dailyVisits: todayVisits.length,
          coldCallPct: todayVisits.length > 0 ? Math.round((coldCalls / todayVisits.length) * 100) : 0,
      });
  };

  const getLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) { alert("Not supported"); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const toggleItem = (key: keyof typeof inspectionItems) => {
      setInspectionItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (formData: FormData) => {
      if (visitType === 'Inspection') formData.set('inspection_data', JSON.stringify(inspectionItems));
      formData.set('visit_type', visitType);
      await addLead(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); 
      await fetchLeads(); 
  };

  // Filter for Calendar
  const calendarLeads = leads.filter(l => isSameDay(parseISO(l.visit_date), date));

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="md:col-span-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">REVLET<span className="text-green-600">CRM</span></h1>
            <p className="text-gray-500">Sales Intelligence Dashboard • {debugMsg}</p>
         </div>
         <div className="bg-black text-white p-4 rounded-xl shadow-lg flex justify-between items-center">
             <div>
                 <div className="text-xs font-bold text-gray-400 uppercase">Daily Visits</div>
                 <div className="text-3xl font-black">{stats.dailyVisits}</div>
             </div>
             <div className="text-right">
                 <div className="text-xs font-bold text-gray-400 uppercase">Cold Call Ratio</div>
                 <div className="text-xl font-bold text-green-400">{stats.coldCallPct}%</div>
             </div>
         </div>
      </div>

      {showSuccess && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-bounce">
              ✅ Saved!
          </div>
      )}
      
      {/* AI COACH BOX */}
      {aiSuggestions.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 flex gap-3 items-start animate-fade-in">
              <span className="text-2xl">🤖</span>
              <div>
                  <h3 className="text-indigo-900 font-bold text-xs uppercase mb-1">AI Coach Suggestions</h3>
                  {aiSuggestions.map((msg, i) => (
                      <div key={i} className="text-sm text-indigo-800 font-medium mb-1">• {msg}</div>
                  ))}
              </div>
          </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setView("form")} className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap ${view === 'form' ? 'bg-black text-white' : 'bg-white border'}`}>📝 Log Activity</button>
          <button onClick={() => setView("map")} className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap ${view === 'map' ? 'bg-black text-white' : 'bg-white border'}`}>🗺️ Map</button>
          <button onClick={() => setView("calendar")} className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap ${view === 'calendar' ? 'bg-black text-white' : 'bg-white border'}`}>📅 Calendar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
              
              {/* VIEW: FORM */}
              {view === 'form' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold">New Activity</h2>
                      <button onClick={getLocation} className={`px-3 py-1 text-xs font-bold rounded-full ${location ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        {location ? "📍 GPS Locked" : "📍 Enable GPS"}
                      </button>
                  </div>
                  <form action={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                          {[{ id: "Cold Call", icon: "❄️" }, { id: "Follow Up", icon: "📞" }, { id: "Inspection", icon: "🔍" }].map(type => (
                              <div key={type.id} onClick={() => setVisitType(type.id)} className={`cursor-pointer p-3 text-center border-2 rounded-lg ${visitType === type.id ? 'border-black bg-gray-50' : 'border-gray-100'}`}>
                                  <div className="text-xl">{type.icon}</div>
                                  <div className="text-xs font-bold mt-1">{type.id}</div>
                              </div>
                          ))}
                      </div>

                      {visitType === 'Inspection' && (
                          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4">
                              <h3 className="font-bold text-orange-900 text-sm mb-3">🚗 Sweep Checklist</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {Object.entries(inspectionItems).map(([key, isChecked]) => (
                                      <div key={key} onClick={() => toggleItem(key as any)} className={`p-2 rounded-lg text-xs font-bold uppercase text-center cursor-pointer border ${isChecked ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-400'}`}>
                                          {key}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <input name="company" required placeholder="Company Name" className="p-3 bg-gray-50 rounded-lg border border-gray-200" />
                        <input name="contact" placeholder="Contact Person" className="p-3 bg-gray-50 rounded-lg border border-gray-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <input name="phone" placeholder="Phone" className="p-3 bg-gray-50 rounded-lg border border-gray-200" />
                         <input name="email" placeholder="Email" className="p-3 bg-gray-50 rounded-lg border border-gray-200" />
                      </div>
                      <textarea name="notes" placeholder="Notes..." className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 h-20" />
                      
                      <details className="text-xs text-gray-500 cursor-pointer">
                          <summary className="font-bold">Advanced Options</summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <select name="recurrence" className="w-full p-2 border rounded mb-2"><option value="">No Recurrence</option><option value="weekly">Weekly</option></select>
                              <div className="flex items-center gap-2">
                                  <input type="checkbox" name="customer_status" value="ONBOARDING" id="onboard" />
                                  <label htmlFor="onboard" className="font-bold text-green-700">🚀 Send to Admin</label>
                              </div>
                          </div>
                      </details>

                      <input type="hidden" name="lat" value={location?.lat || ""} />
                      <input type="hidden" name="lng" value={location?.lng || ""} />
                      <button className="w-full py-4 bg-black text-white font-bold rounded-xl shadow-lg">💾 Save Activity</button>
                  </form>
                </div>
              )}

              {/* VIEW: MAP */}
              {view === 'map' && <div className="h-[500px] z-0 relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"><MapWrapper leads={leads} /></div>}

              {/* VIEW: CALENDAR */}
              {view === 'calendar' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <Calendar 
                        onChange={(d) => setDate(d as Date)} 
                        value={date}
                        className="w-full border-none font-sans"
                        tileContent={({ date, view }) => {
                            const count = leads.filter(l => isSameDay(parseISO(l.visit_date), date)).length;
                            return count > 0 ? <div className="flex justify-center mt-1"><div className="bg-green-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{count}</div></div> : null;
                        }}
                      />
                      <div className="mt-6 pt-6 border-t border-gray-100">
                          <h3 className="font-bold text-gray-900 mb-4">Activity for {format(date, 'MMMM do, yyyy')}</h3>
                          {calendarLeads.length === 0 ? (
                              <p className="text-gray-400 text-sm">No activity found for this date.</p>
                          ) : (
                              <div className="space-y-3">
                                  {calendarLeads.map(l => (
                                      <div key={l.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                                          <div>
                                              <div className="font-bold text-sm">{l.company_name}</div>
                                              <div className="text-xs text-gray-500">{l.visit_type} • {format(parseISO(l.visit_date), 'h:mm a')}</div>
                                          </div>
                                          {l.customer_status === 'ONBOARDING' && <span className="text-xs font-bold text-green-600">🚀 Sent</span>}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>

          <div className="lg:col-span-5 space-y-4">
              <h3 className="font-bold text-gray-400 text-xs uppercase">Your Feed</h3>
              {leads.length === 0 && <div className="p-6 bg-gray-50 text-center rounded-xl border border-dashed"><p className="text-gray-500 font-bold">No activity visible.</p></div>}
              {leads.map(lead => (
                  <div key={lead.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900">{lead.company_name}</div>
                          <div className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100">{lead.visit_type}</div>
                      </div>
                      {lead.inspection_data && (
                          <div className="flex flex-wrap gap-1 mb-2">
                              {Object.entries(lead.inspection_data).map(([k, v]) => v ? <span key={k} className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded uppercase">{k}</span> : null)}
                          </div>
                      )}
                      {lead.notes && <div className="text-sm text-gray-600 italic">"{lead.notes}"</div>}
                      <div className="mt-2 text-[10px] text-gray-400 text-right">{format(parseISO(lead.visit_date), 'MMM d, h:mm a')}</div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}