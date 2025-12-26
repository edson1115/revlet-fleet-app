"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeslaSection } from "@/components/tesla/TeslaSection";

export default function CustomerCreateRequestPage() {
  const router = useRouter();
  
  // Data State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("General Inspection");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]); // ✅ Restored Photo State

  // 1. Load Vehicles
  useEffect(() => {
    fetch("/api/customer/vehicles")
      .then((res) => res.json())
      .then((js) => {
        setVehicles(js.vehicles || []);
        if (js.vehicles?.length === 1) setSelectedVehicleId(js.vehicles[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Real AI Analysis
  async function runAiAnalysis() {
    if (!notes) return alert("Please describe the issue first.");
    
    setAnalyzing(true);
    try {
        const res = await fetch("/api/ai/analyze-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes })
        });
        const js = await res.json();
        
        if (js.ok) {
            setServiceType(js.prediction.title);
            // Optional: You could show a "Priority: Urgent" badge if returned
        }
    } catch (e) {
        console.error(e);
    } finally {
        setAnalyzing(false);
    }
  }

  // 3. Handle Photo Upload
  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const fd = new FormData();
    fd.append("file", files[0]); // Upload one at a time for simplicity

    try {
        // Reuse your existing upload endpoint
        const res = await fetch("/api/uploads/vehicle-health", { method: "POST", body: fd });
        const js = await res.json();
        if (js.ok && js.url) {
            setPhotos(prev => [...prev, js.url]);
        } else {
            alert("Upload failed");
        }
    } catch (e) {
        console.error(e);
        alert("Upload error");
    } finally {
        setUploading(false);
    }
  }

  // 4. Submit Request
  async function handleSubmit() {
    if (!selectedVehicleId) return alert("Please select a vehicle");
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          service_title: serviceType,
          service_description: notes,
          reported_mileage: mileage ? parseInt(mileage) : null,
          photo_urls: photos // ✅ Pass photos array to API
        }),
      });

      if (res.ok) {
        router.push("/customer/requests");
        router.refresh();
      } else {
        alert("Failed to create request");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-6">
      <div className="flex items-center gap-2">
         <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black">&larr; Cancel</button>
         <h1 className="text-3xl font-bold tracking-tight">New Service Request</h1>
      </div>

      <TeslaSection label="1. Select Vehicle">
        {loading ? (
            <div className="text-gray-400">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
            <div className="text-red-500">No vehicles found. Add a vehicle first.</div>
        ) : (
            <select 
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none text-lg"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} {v.plate ? `(${v.plate})` : ''}
                    </option>
                ))}
            </select>
        )}
      </TeslaSection>

      <TeslaSection label="2. Issue Details">
         <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Describe Issue</label>
                <textarea 
                    className="w-full mt-1 p-3 bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-black min-h-[100px]"
                    placeholder="e.g. My car is making a weird noise when braking..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* AI BUTTON */}
            <div className="flex justify-end">
                <button
                    onClick={runAiAnalysis}
                    disabled={analyzing || !notes}
                    className="flex items-center gap-2 text-xs font-bold bg-purple-100 text-purple-700 px-3 py-2 rounded hover:bg-purple-200 transition disabled:opacity-50"
                >
                    {analyzing ? "Thinking..." : "✨ Auto-Detect Service Type"}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Service Type</label>
                    <select 
                        className="w-full mt-1 p-3 bg-white border-b border-gray-300 outline-none focus:border-black"
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                    >
                        <option value="General Inspection">General Inspection</option>
                        <option value="Oil Change">Oil Change</option>
                        <option value="Tire Service">Tire Service</option>
                        <option value="Battery Service">Battery Service</option>
                        <option value="Brake Service">Brake Service</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Current Mileage</label>
                    <input 
                        type="number" 
                        className="w-full mt-1 p-2 border-b border-gray-300 outline-none focus:border-black"
                        placeholder="e.g. 45000"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                    />
                </div>
            </div>
         </div>
      </TeslaSection>

      {/* ✅ RESTORED PHOTO UPLOAD */}
      <TeslaSection label="3. Photos (Optional)">
         <div className="space-y-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {photos.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt="Issue" className="w-full h-full object-cover" />
                    </div>
                ))}
                
                <label className="w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black hover:bg-gray-50 transition">
                    <span className="text-2xl text-gray-400">+</span>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePhotoUpload(e.target.files)}
                        disabled={uploading}
                    />
                </label>
            </div>
            {uploading && <p className="text-xs text-blue-600 animate-pulse">Uploading photo...</p>}
         </div>
      </TeslaSection>

      <div className="flex justify-end">
        <button
            onClick={handleSubmit}
            disabled={submitting || !selectedVehicleId}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 shadow-lg"
        >
            {submitting ? "Creating..." : "Create Request"}
        </button>
      </div>
    </div>
  );
}