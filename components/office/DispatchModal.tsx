"use client";

import { useState, useEffect } from "react";

export function DispatchModal({ 
    isOpen, 
    onClose, 
    onAssign 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onAssign: (techId: string, date: string) => void;
}) {
    const [techs, setTechs] = useState<any[]>([]);
    const [selectedTech, setSelectedTech] = useState("");
    const [scheduleDate, setScheduleDate] = useState("");
    const [loading, setLoading] = useState(true);

    // Load Techs when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // We reuse the existing lookup API
            fetch("/api/office/lookups/techs") 
                .then(res => res.json())
                .then(js => setTechs(js.techs || []))
                .catch(e => console.error(e))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Dispatch Job</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Technician</label>
                        {loading ? (
                            <div className="p-3 text-sm text-gray-400">Loading techs...</div>
                        ) : (
                            <select 
                                className="w-full mt-2 p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-black"
                                value={selectedTech}
                                onChange={(e) => setSelectedTech(e.target.value)}
                            >
                                <option value="">-- Unassigned --</option>
                                {techs.map(t => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Schedule Start (Optional)</label>
                        <input 
                            type="datetime-local" 
                            className="w-full mt-2 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-black"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 font-medium text-gray-600 hover:text-black">Cancel</button>
                    <button 
                        onClick={() => onAssign(selectedTech, scheduleDate)}
                        disabled={!selectedTech}
                        className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Dispatch
                    </button>
                </div>
            </div>
        </div>
    );
}