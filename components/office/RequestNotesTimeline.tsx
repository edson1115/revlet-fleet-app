"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import TeslaButton from "@/components/tesla/TeslaButton";

type Note = {
  id: string;
  role: "CUSTOMER" | "OFFICE" | "DISPATCH" | "TECH";
  note: string;
  created_at: string;
};

export function RequestNotesTimeline({ requestId }: { requestId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  /* =====================================================
     LOAD NOTES
  ===================================================== */
  async function loadNotes() {
    setLoading(true);

    try {
      const res = await fetch(`/api/requests/${requestId}/notes`, {
        cache: "no-store",
        credentials: "include",
      });

      const js = await res.json();

      if (js.ok && Array.isArray(js.notes)) {
        const ordered = [...js.notes].sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        setNotes(ordered);
      }
    } catch (err) {
      console.error("Load notes failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     ADD NOTE (OFFICE)
  ===================================================== */
  async function addNote() {
    if (!newNote.trim() || saving) return;

    setSaving(true);

    try {
      const res = await fetch(
        `/api/office/requests/${requestId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ note: newNote }),
        }
      );

      const js = await res.json();

      if (!res.ok) {
        alert(js.error || "Failed to add note");
        return;
      }

      setNewNote("");
      await loadNotes();
    } catch (err) {
      console.error("Add note failed:", err);
      alert("Unexpected error adding note");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [requestId]);

  return (
    <TeslaSection label="Notes Timeline">
      {loading && (
        <div className="text-sm text-gray-500">
          Loading notes…
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div className="text-sm text-gray-500">
          No notes yet.
        </div>
      )}

      <div className="space-y-4">
        {notes.map((n) => (
          <div
            key={n.id}
            className="rounded-lg border border-gray-200 p-3"
          >
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-semibold">{n.role}</span>
              <span>
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>

            <div className="text-sm whitespace-pre-wrap">
              {n.note}
            </div>
          </div>
        ))}
      </div>

      {/* ADD NOTE */}
      <div className="mt-4 space-y-2">
        <label className="text-sm text-gray-600 font-medium">
          Add internal note
        </label>

        <textarea
          rows={3}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add internal note…"
          className="
            w-full border border-gray-300 rounded-xl px-4 py-2
            text-sm focus:outline-none focus:ring-[2px]
            focus:ring-black transition-all
          "
        />

        <TeslaButton
          onClick={addNote}
          disabled={saving || !newNote.trim()}
        >
          {saving ? "Saving…" : "Add Note"}
        </TeslaButton>
      </div>
    </TeslaSection>
  );
}
