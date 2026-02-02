"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { createBrowserClient } from "@supabase/ssr";
import ImageDropzone from "@/components/ui/ImageDropzone"; // ✅ IMPORTED

const SERVICES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Battery Replacement",
  "Check Engine Light",
  "Flat Tire Repair",
  "General Inspection",
  "Other"
];

export default function NewRequestClient({ customerId, vehicles }: { customerId: string, vehicles: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(false);
  
  // Form State
  // Auto-select vehicle if passed in URL
  const [selectedVehicle, setSelectedVehicle] = useState(
      searchParams.get("vehicle_id") || vehicles[0]?.id || ""
  );
  const [serviceType, setServiceType] = useState(SERVICES[0]);
  const [mileage, setMileage] = useState(""); // ✅ Added Mileage State
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]); // ✅ FILES STATE

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
        // ✅ Pack Mileage into the description for Dispatch
        const finalDescription = `Current Mileage: ${mileage || "Not Provided"} \n\n${description}`;

        // 1. Create Ticket
        const { data: ticket, error } = await supabase.from("service_requests").insert({
            customer_id: customerId,
            vehicle_id: selectedVehicle,
            service_title: serviceType,
            description: finalDescription, // Updated Description
            status: "NEW", 
            technician_notes: "",
            created_by_role: "CUSTOMER"
        }).select().single();

        if (error) throw error;
        
        // 2. Upload Images (If any)
        if (files.length > 0 && ticket) {
            for (const file of files) {
                const ext = file.name.split(".").pop();
                const fileName = `${ticket.id}/${Date.now()}.${ext}`;

                const { error: uploadErr } = await supabase.storage
                    .from("request-images") // ⚠️ Ensure bucket exists!
                    .upload(fileName, file);

                if (!uploadErr) {
                    const { data: { publicUrl } } = supabase.storage.from("request-images").getPublicUrl(fileName);
                    await supabase.from("request_images").insert({
                        request_id: ticket.id,
                        url_full: publicUrl,
                        kind: "customer_upload"
                    });
                } else {
                    console.error("Upload error:", uploadErr);
                    // Optional: alert user if specific image fails, or just log it
                }
            }
        }

        router.push("/customer"); 
        router.refresh();
    } catch (err: any) {
        // ✅ IMPROVED LOGGING
        console.error("Submission Error Details:", err);
        
        // Check for specific Supabase error codes
        if (err.code === "42501" || err.message?.includes("policy")) {
            alert("Permission Denied: You do not have permission to create requests or upload photos.");
        } else if (err.message?.includes("storage")) {
            alert("Storage Error: " + err.message);
        } else {
            alert("Failed to submit request: " + (err.message || "Unknown error"));
        }
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
        <button onClick={() => router.back()} className="text-xs font-bold text-zinc-400 hover:text-black mb-6 uppercase tracking-widest transition">← Cancel</button>
        
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl">
            <h1 className="text-2xl font-black text-zinc-900 mb-2">New Service Request</h1>
            <p className="text-zinc-500 text-sm mb-8">Submit a ticket to dispatch. We will confirm scheduling shortly.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ROW 1: Vehicle & Mileage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">Select Vehicle</label>
                        <select 
                            value={selectedVehicle}
                            onChange={(e) => setSelectedVehicle(e.target.value)}
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-black/5"
                        >
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.year} {v.make} {v.model} ({v.plate})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ✅ MILEAGE INPUT */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">Current Mileage</label>
                        <input 
                            type="number"
                            required
                            placeholder="e.g. 45021"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                </div>

                {/* SERVICE TYPE */}
                <div>
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">Service Needed</label>
                    <div className="grid grid-cols-2 gap-3">
                        {SERVICES.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setServiceType(s)}
                                className={clsx(
                                    "p-3 rounded-xl text-xs font-bold text-left transition-all border",
                                    serviceType === s 
                                        ? "bg-black text-white border-black shadow-lg transform scale-[1.02]" 
                                        : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">Additional Details (Optional)</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Noise coming from front left..."
                        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-black/5 min-h-[100px] resize-none"
                    />
                </div>

                {/* ✅ PHOTOS SECTION */}
                <div>
                    <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wide mb-2">Photos (Optional)</label>
                    <ImageDropzone 
                        onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
                        existingFiles={files}
                        onRemove={(i) => setFiles(files.filter((_, idx) => idx !== i))}
                    />
                </div>

                {/* SUBMIT */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {loading ? (
                        <span className="animate-pulse">Sending Request...</span>
                    ) : (
                        "SEND REQUEST"
                    )}
                </button>

            </form>
        </div>
    </div>
  );
}