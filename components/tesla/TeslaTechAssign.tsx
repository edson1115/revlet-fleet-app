"use client";

import React, { useState } from "react";
import { FiUser, FiCheck, FiArrowRightCircle } from "react-icons/fi";

export default function TeslaTechAssign({
  requestId,
  technician,
  techs,
  scheduledAt,
  onUpdated,
}: {
  requestId: string;
  technician: { id?: string; full_name?: string | null } | null;
  techs: { id: string; full_name?: string | null }[];
  scheduledAt?: string | null;
  onUpdated?: (partial: any) => void;
}) {
  const [techId, setTechId] = useState<string>(technician?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);

    try {
      // Assign tech
      await fetch("/api/requests/batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "assign",
          ids: [requestId],
          technician_id: techId || null,
        }),
      });

      // Call back to drawer
      const selectedTech = techs.find((t) => t.id === techId) || null;

      onUpdated?.({
        technician: selectedTech
          ? {
              id: selectedTech.id,
              full_name: selectedTech.full_name,
            }
          : null,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Technician</h3>

        {technician?.full_name ? (
          <div className="flex items-center gap-2 text-sm">
            <FiUser className="text-gray-600" />
            <span className="font-medium">{technician.full_name}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-500">No tech assigned</div>
        )}
      </div>

      {/* BODY */}
      <div className="p-5 space-y-3">
        <label className="text-xs font-semibold text-gray-600">Assign</label>

        {/* SELECT TECH */}
        <select
          className="w-full border rounded-lg px-3 py-2 bg-gray-50"
          value={techId}
          onChange={(e) => setTechId(e.target.value)}
        >
          <option value="">— No Tech —</option>
          {techs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name || "Unnamed"}
            </option>
          ))}
        </select>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <FiCheck className="text-white" /> Save Technician
            </>
          )}
        </button>

        {error && (
          <div className="text-xs text-red-600 mt-2 text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
