"use client";

export default function TeslaTechAssignCard({
  request,
  techs,
  onUpdate,
}: {
  request: {
    id: string;
    technician?: { id: string | null; full_name?: string | null } | null;
    scheduled_at?: string | null;
  };
  techs: { id: string; full_name?: string | null }[];
  onUpdate?: (next: any) => void;
}) {
  const [techId, setTechId] = useState(request.technician?.id || "");
  const [dt, setDt] = useState(
    request.scheduled_at
      ? new Date(request.scheduled_at).toISOString().slice(0, 16)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function toISO(val: string) {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function save() {
    setSaving(true);
    setErr("");

    try {
      if (techId) {
        await fetch("/api/requests/batch", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "assign",
            ids: [request.id],
            technician_id: techId,
          }),
        });
      }

      if (dt) {
        const iso = toISO(dt);
        await fetch("/api/requests/batch", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "reschedule",
            ids: [request.id],
            scheduled_at: iso,
            status: "SCHEDULED",
          }),
        });

        onUpdate?.({
          technician: techId
            ? {
                id: techId,
                full_name:
                  techs.find((t) => t.id === techId)?.full_name || "",
              }
            : null,
          scheduled_at: iso,
          status: "SCHEDULED",
        });
      }
    } catch (e: any) {
      setErr(e.message || "Failed to update");
    }

    setSaving(false);
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Technician Assignment</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-black text-white">
          Dispatch
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Technician
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm bg-[#FAFAFA]"
            value={techId}
            onChange={(e) => setTechId(e.target.value)}
          >
            <option value="">— select —</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Scheduled Time
          </label>
          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2 text-sm bg-[#FAFAFA]"
            value={dt}
            onChange={(e) => setDt(e.target.value)}
          />
        </div>

        {err && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
            {err}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
