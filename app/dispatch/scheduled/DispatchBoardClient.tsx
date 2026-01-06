"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: "READY_TO_SCHEDULE", label: "Ready to Schedule", color: "bg-gray-100 border-gray-200" },
  { id: "SCHEDULED", label: "Scheduled", color: "bg-blue-50 border-blue-200" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-green-50 border-green-200" }
];

export default function DispatchBoardClient({ initialRequests, technicians }: { initialRequests: any[], technicians: any[] }) {
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  
  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "", techId: "", buddyId: "" });

  // --- DRAG END ---
  async function onDragEnd(result: any) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    setRequests(prev => prev.map(r => r.id === draggableId ? { ...r, status: newStatus } : r));

    await fetch(`/api/dispatch/update-status`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ id: draggableId, status: newStatus })
    });
  }

  // --- OPEN SCHEDULE MODAL ---
  function openSchedule(req: any) {
      // 1. Pre-fill data if it exists
      setScheduleData({
          date: req.scheduled_start_at ? new Date(req.scheduled_start_at).toISOString().split('T')[0] : "",
          time: req.scheduled_start_at ? new Date(req.scheduled_start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : "",
          techId: req.technician_id || "",
          buddyId: req.second_technician_id || ""
      });
      // 2. Show the modal
      setShowScheduleModal(true);
  }

  // --- CONFIRM SCHEDULE ---
  async function confirmSchedule() {
      if (!selectedReq) return;

      // 1. Optimistic Update (Update UI instantly)
      const updatedReqs = requests.map(r => {
          if (r.id === selectedReq.id) {
              return {
                  ...r,
                  status: "SCHEDULED",
                  technician_id: scheduleData.techId,
                  second_technician_id: scheduleData.buddyId,
                  scheduled_start_at: scheduleData.date ? `${scheduleData.date}T${scheduleData.time || "09:00"}:00` : null,
                  // Update names for display
                  tech: technicians.find(t => t.id === scheduleData.techId),
                  buddy: technicians.find(t => t.id === scheduleData.buddyId)
              };
          }
          return r;
      });
      setRequests(updatedReqs);
      
      // 2. Close Modals
      setShowScheduleModal(false);
      setSelectedReq(null);

      // 3. Send to Server
      await fetch(`/api/dispatch/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            request_id: selectedReq.id, 
            technician_id: scheduleData.techId,
            second_technician_id: scheduleData.buddyId || null,
            scheduled_date: scheduleData.date,
            scheduled_time: scheduleData.time
        })
     });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="font-bold text-xl">ZOMBIE BOARD 🧟</h1>
          <div className="text-sm text-gray-500">{requests.length} Active Jobs</div>
       </div>

       <div className="flex-1 overflow-x-auto p-6">
          <DragDropContext onDragEnd={onDragEnd}>
             <div className="flex gap-6 min-w-[1000px] h-full">
                {COLUMNS.map(col => (
                   <div key={col.id} className={`flex-1 flex flex-col rounded-xl border ${col.color} p-4 min-w-[300px]`}>
                      <h2 className="font-bold text-gray-700 mb-4 flex justify-between">
                         {col.label}
                         <span className="bg-white px-2 rounded text-sm shadow-sm">{requests.filter(r => r.status === col.id).length}</span>
                      </h2>
                      <Droppable droppableId={col.id}>
                         {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-3">
                               {requests.filter(r => r.status === col.id).map((r, index) => (
                                   <Draggable key={r.id} draggableId={r.id} index={index}>
                                      {(provided) => (
                                         <div 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => setSelectedReq(r)}
                                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group"
                                         >
                                            <div className="flex justify-between items-start mb-2">
                                               <span className="font-bold text-sm text-gray-900">{r.vehicle?.year} {r.vehicle?.model}</span>
                                               {r.vehicle?.unit_number && <span className="bg-gray-100 text-[10px] font-bold px-1.5 py-0.5 rounded">{r.vehicle.unit_number}</span>}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-3">{r.service_title}</div>
                                            
                                            {/* Tech Avatars */}
                                            <div className="flex gap-1 mt-2">
                                                {r.tech && <span className="text-[10px] bg-black text-white px-2 py-1 rounded-full">{r.tech.full_name?.split(' ')[0]}</span>}
                                                {r.buddy && <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded-full" title="Buddy Tech">+ {r.buddy.full_name?.split(' ')[0]}</span>}
                                                {!r.tech && !r.buddy && <span className="text-[10px] text-gray-400 italic">Unassigned</span>}
                                            </div>
                                         </div>
                                      )}
                                   </Draggable>
                               ))}
                               {provided.placeholder}
                            </div>
                         )}
                      </Droppable>
                   </div>
                ))}
             </div>
          </DragDropContext>
       </div>

       {/* DETAIL MODAL (Shows Info First) */}
       {selectedReq && !showScheduleModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                   <div>
                      <h2 className="text-xl font-bold">{selectedReq.service_title}</h2>
                      <p className="text-xs text-gray-400 uppercase">ID: {selectedReq.id.slice(0, 8)}</p>
                   </div>
                   <button onClick={() => setSelectedReq(null)} className="text-gray-400 hover:text-black text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6 space-y-6">
                   
                   {/* Info Grid */}
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Customer</label>
                         <div className="font-bold text-lg">{selectedReq.customer?.name}</div>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Vehicle</label>
                         <div className="font-bold text-lg">{selectedReq.vehicle?.year} {selectedReq.vehicle?.model}</div>
                         <div className="text-sm text-gray-500 font-mono">VIN: {selectedReq.vehicle?.plate}</div>
                      </div>
                   </div>

                   {/* Parts Section (NEW FIX) */}
                   <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <label className="text-[10px] font-bold text-amber-700 uppercase block mb-2">📦 Parts Required</label>
                      {selectedReq.request_parts && selectedReq.request_parts.length > 0 ? (
                          <div className="space-y-2">
                             {selectedReq.request_parts.map((p: any) => (
                                <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded border border-amber-100">
                                   <div className="text-sm font-bold text-gray-900">{p.part_name} <span className="text-gray-400 font-normal">#{p.part_number}</span></div>
                                   <div className="text-sm font-bold bg-gray-100 px-2 rounded">x{p.quantity}</div>
                                </div>
                             ))}
                          </div>
                      ) : <p className="text-sm text-gray-500 italic">No specific parts listed.</p>}
                   </div>

                </div>
                <div className="bg-gray-50 px-6 py-4 border-t text-right flex justify-end gap-3">
                   <button onClick={() => setSelectedReq(null)} className="px-4 py-2 text-gray-600 font-bold">Close</button>
                   <button onClick={() => openSchedule(selectedReq)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Schedule Job &rarr;</button>
                </div>
             </div>
          </div>
       )}

       {/* SCHEDULE MODAL (THIS HAS THE BUDDY SYSTEM) */}
       {showScheduleModal && (
           <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
               <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-10">
                   {/* I CHANGED THIS TITLE SO YOU KNOW IT'S NEW */}
                   <h2 className="text-lg font-bold mb-4">Assign Crew & Schedule</h2>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date & Time</label>
                           <div className="flex gap-2">
                               <input type="date" className="w-full p-2 border rounded-lg" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
                               <input type="time" className="w-1/3 p-2 border rounded-lg" value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
                           </div>
                       </div>
                       
                       {/* Lead Tech Dropdown */}
                       <div className="pt-2">
                           <label className="block text-xs font-bold text-gray-900 uppercase mb-1">Lead Technician (Required)</label>
                           <select 
                               className="w-full p-3 border-2 border-gray-200 rounded-lg bg-white font-bold"
                               value={scheduleData.techId} 
                               onChange={e => setScheduleData({...scheduleData, techId: e.target.value})}
                           >
                               <option value="">Select Tech...</option>
                               {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                           </select>
                       </div>

                       {/* Buddy Tech Dropdown (NEW) */}
                       <div>
                           <label className="block text-xs font-bold text-purple-600 uppercase mb-1">Buddy Tech (Optional)</label>
                           <select 
                               className="w-full p-3 border-2 border-purple-100 rounded-lg bg-purple-50 text-purple-900"
                               value={scheduleData.buddyId} 
                               onChange={e => setScheduleData({...scheduleData, buddyId: e.target.value})}
                           >
                               <option value="">No Buddy Needed</option>
                               {technicians.map(t => (
                                   // Don't show the Lead Tech in the Buddy list (prevent duplicate)
                                   t.id !== scheduleData.techId && <option key={t.id} value={t.id}>{t.full_name}</option>
                               ))}
                           </select>
                       </div>
                   </div>

                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                       <button onClick={confirmSchedule} className="flex-1 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800">Confirm Schedule</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}