"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import TeslaButton from "@/components/tesla/TeslaButton";
import TeslaInput from "@/components/tesla/TeslaInput";

type Part = {
  id: string;
  part_number: string;
  description?: string;
  quantity?: number;
  vendor?: string;
};

export function RequestPartsSection({ requestId }: { requestId: string }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [vendor, setVendor] = useState("");

  async function loadParts() {
    setLoading(true);

    const res = await fetch(`/api/office/requests/${requestId}/parts`, {
      cache: "no-store",
      credentials: "include",
    });

    const js = await res.json();
    if (js.ok) setParts(js.parts || []);

    setLoading(false);
  }

  async function addPart() {
    if (!partNumber.trim()) return;

    setSaving(true);

    await fetch(`/api/office/requests/${requestId}/parts`, {
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

    setPartNumber("");
    setDescription("");
    setQuantity(1);
    setVendor("");

    await loadParts();
    setSaving(false);
  }

  useEffect(() => {
    loadParts();
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
              className="border rounded-lg px-3 py-2 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">
                  {p.part_number}
                </div>
                <div className="text-gray-500">
                  {p.description || "—"}
                </div>
              </div>
              <div className="text-gray-500">
                Qty {p.quantity ?? 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400">
          No parts added yet.
        </div>
      )}

      {/* ADD PART */}
      <div className="mt-4 border-t pt-4 space-y-3">
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

        <TeslaButton
          onClick={addPart}
          disabled={saving || !partNumber.trim()}
        >
          {saving ? "Adding…" : "Add Part"}
        </TeslaButton>
      </div>
    </TeslaSection>
  );
}
