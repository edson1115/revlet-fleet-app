"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr"; // 👈 Using the correct client
import clsx from "clsx";

// --- ICONS ---
const IconUser = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconClock = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconLock = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

export default function DispatchPage() {
  const router = useRouter();
  
  // Init Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  
  // Permissions State
  const [userRole, setUserRole] = useState<string>("");

  // Modal State
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  async function checkUserAndLoad() {
    setLoading(true);

    // 1. Check current user role
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.user_metadata?.role || "OFFICE";
    setUserRole(role);

    // 2. Fetch Open Jobs
    const resReq = await fetch("/api/office/requests");
    const dataReq = await resReq.json();
    
    // 3. Fetch Techs
    const resTech = await fetch("/api/office/team");
    const dataTech = await resTech.json();

    if (dataReq.requests) setRequests(dataReq.requests.filter((r: any) => r.status !== 'BILLED' && r.status !== 'CANCELLED' && r.status !== 'COMPLETED'));
    if (dataTech.techs) setTechs(dataTech.techs);
    
    setLoading(false);
  }

  async function handleAssign(techId: string) {
      if (!selectedJob) return;

      const res = await fetch(`/api/office/requests/${selectedJob.id}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ technician_id: techId })
      });

      if (res.ok) {
          setSelectedJob(null);
          checkUserAndLoad(); // Refresh board
      } else {
          alert("Failed to assign (Permission Denied)");
      }
  }

  // Filter columns
  const unassigned = requests.filter(r => !r.technician_id);
  const assigned = requests.filter(r => r.technician_id && r.status === 'SCHEDULED');
  const inProgress = requests.filter(r => r.status === 'IN_PROGRESS');

  // Permission Check
  const canEdit = ["DISPATCHER", "ADMIN", "SUPERADMIN"].includes(userRole);

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold">Loading Dispatch...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20 overflow-x-auto">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-4">
             <div onClick={() => router.push("/office")} className="bg-black text-white px-3 py-1 rounded text-xl font-black italic cursor-pointer">REVLET</div>
             <div className="h-6 w-px bg-gray-200"></div>
             <h1 className="font-bold text-gray-900">Dispatch Board</h1>
             
             {/* READ ONLY BADGE */}
             {!canEdit && (
                 <span className="bg-gray-100 text-gray-500 border border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                     <IconLock /> READ ONLY
                 </span>
             )}
         </div>
         <button onClick={() => router.push("/office")} className="text-xs font-bold text-gray-500 hover:text-black">Exit</button>
      </div>

      <div className="p-6 min-w-[1000px]">
          <div className="grid grid-cols-3 gap-6">
              
              {/* COL 1: UNASSIGNED */}
              <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-gray-200/50 p-2 rounded-lg border border-gray-300/50">
                      <span className="text-xs font-black uppercase text-gray-500 pl-2">Unassigned</span>
                      <span className="bg-gray-300 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{unassigned.length}</span>
                  </div>
                  
                  {unassigned.map(job => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        onClick={canEdit ? () => setSelectedJob(job) : undefined} 
                        disabled={!canEdit}
                      />
                  ))}
                  {unassigned.length === 0 && <EmptySlot />}
              </div>

              {/* COL 2: ASSIGNED (PENDING) */}
              <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <span className="text-xs font-black uppercase text-blue-500 pl-2">Assigned / Pending</span>
                      <span className="bg-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{assigned.length}</span>
                  </div>

                  {assigned.map(job => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        techName={techs.find(t => t.id === job.technician_id)?.name} 
                        onClick={canEdit ? () => setSelectedJob(job) : undefined}
                        disabled={!canEdit}
                      />
                  ))}
                  {assigned.length === 0 && <EmptySlot />}
              </div>

              {/* COL 3: IN PROGRESS */}
              <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-100">
                      <span className="text-xs font-black uppercase text-green-600 pl-2">Active Bays</span>
                      <span className="bg-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{inProgress.length}</span>
                  </div>

                  {inProgress.map(job => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        active 
                        techName={techs.find(t => t.id === job.technician_id)?.name} 
                      />
                  ))}
                  {inProgress.length === 0 && <EmptySlot />}
              </div>

          </div>
      </div>

      {/* ASSIGN MODAL (Only shows if canEdit is true) */}
      {selectedJob && canEdit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">Assign Technician</h3>
                      <p className="text-xs text-gray-500">Who is working on the <strong>{selectedJob.vehicle?.model}</strong>?</p>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                      <button 
                        onClick={() => handleAssign("")}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-bold rounded-lg mb-1"
                      >
                          🚫 Unassign (Return to Queue)
                      </button>
                      {techs.map(tech => (
                          <button
                             key={tech.id}
                             onClick={() => handleAssign(tech.id)}
                             className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition"
                          >
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs">
                                  {tech.name[0].toUpperCase()}
                              </div>
                              <div className="text-sm font-bold text-gray-900">{tech.name}</div>
                          </button>
                      ))}
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <button onClick={() => setSelectedJob(null)} className="w-full py-3 bg-white border border-gray-300 rounded-xl font-bold text-sm hover:bg-gray-100">Cancel</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

function JobCard({ job, onClick, techName, active, disabled }: { job: any, onClick?: () => void, techName?: string, active?: boolean, disabled?: boolean }) {
    return (
        <div 
           onClick={onClick}
           className={clsx(
               "bg-white p-4 rounded-xl border shadow-sm transition group relative overflow-hidden",
               active ? "border-green-400 ring-1 ring-green-100" : "border-gray-200",
               !disabled && !active && "cursor-pointer hover:border-black hover:shadow-md",
               disabled && "opacity-90 grayscale-[0.5]"
           )}
        >
            {active && <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-wider">Working</div>}
            
            <div className="mb-2">
                <div className="font-bold text-gray-900 leading-tight">{job.vehicle?.year} {job.vehicle?.model}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{job.plate || "NO PLATE"}</div>
            </div>
            
            <div className="bg-gray-50 px-2 py-1.5 rounded text-xs font-medium text-gray-700 mb-3 truncate border border-gray-100">
                {job.service_title}
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                    <IconUser /> {techName || "Unassigned"}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    <IconClock /> {new Date(job.created_at).toLocaleDateString()}
                </div>
            </div>
        </div>
    )
}

function EmptySlot() {
    return (
        <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-xs text-gray-300 font-bold uppercase tracking-wide">Empty Slot</span>
        </div>
    )
}