"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
// Ensure these paths are correct for your project
import TeslaButton from "@/components/tesla/TeslaButton"; 
import TeslaInput from "@/components/tesla/TeslaInput";

type Part = {
  id: string;
  part_number: string;
  description?: string;
  quantity?: number;
  vendor?: string;
};

// ✅ FIX: Accept 'request' object instead of 'requestId' string
export function RequestPartsSection({ request }: { request: any }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [vendor, setVendor] = useState("");

  // ✅ FIX: Safely extract ID
  const requestId = request?.id;

  async function loadParts() {
    if (!requestId) return; // Guard clause
    
    setLoading(true);
    try {
      const res = await fetch(`/api/office/requests/${requestId}/parts`, {
        cache: "no-store",
        credentials: "include",
      });

      const js = await res.json();
      if (js.ok) setParts(js.parts || []);
    } catch (err) {
      console.error("Error loading parts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addPart() {
    if (!partNumber.trim() || !requestId) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/office/requests/${requestId}/parts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_number: partNumber.trim(),
          description: description.trim() || null,
          quantity: quantity || 1,
          vendor: vendor.trim() || null,
        }),
      });

      if (res.ok) {
        setPartNumber("");
        setDescription("");
        setQuantity(1);
        setVendor("");
        await loadParts();
      } else {
        alert("Failed to save part");
      }
    } catch (err) {
      console.error("Error adding part:", err);
    } finally {
      setSaving(false);
    }
  }

  // ✅ FIX: Delete function (missing in your previous file)
  async function removePart(partId: string) {
    if (!confirm("Remove this part?")) return;
    
    // Optimistic UI update
    setParts(prev => prev.filter(p => p.id !== partId));

    await fetch(`/api/office/requests/${requestId}/parts?part_id=${partId}`, {
      method: "DELETE",
    });
  }

  useEffect(() => {
    if (requestId) {
      loadParts();
    }
  }, [requestId]);

  return (
    <TeslaSection label="Parts Ordered">
      {loading ? (
        <div className="text-sm text-gray-500">
          Loading parts…
        </div>
      ) : parts.length ? (
        <div className="space-y-2 text-sm">
          {parts.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg px-3 py-2 flex justify-between items-center bg-white"
            >
              <div>
                <div className="font-semibold text-black">
                  {p.part_number}
                </div>
                <div className="text-gray-500 text-xs">
                  {p.description || "—"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-gray-600 font-medium">
                  Qty: {p.quantity ?? 1}
                </div>
                {/* Delete Button */}
                <button 
                  onClick={() => removePart(p.id)}
                  className="text-gray-400 hover:text-red-600 px-2 font-bold text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic">
          No parts added yet.
        </div>
      )}

      {/* ADD PART FORM */}
      <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <TeslaInput
            placeholder="Part #"
            value={partNumber}
            onChange={(e: any) => setPartNumber(e.target.value)}
          />

          <TeslaInput
            placeholder="Description"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
          />

          <TeslaInput
            type="number"
            min={1}
            placeholder="Qty"
            value={quantity}
            onChange={(e: any) =>
              setQuantity(Number(e.target.value || 1))
            }
          />

          <TeslaInput
            placeholder="Vendor (optional)"
            value={vendor}
            onChange={(e: any) => setVendor(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
            <TeslaButton
              onClick={addPart}
              disabled={saving || !partNumber.trim()}
            >
              {saving ? "Adding…" : "+ Add Part"}
            </TeslaButton>
        </div>
      </div>
    </TeslaSection>
  );
}