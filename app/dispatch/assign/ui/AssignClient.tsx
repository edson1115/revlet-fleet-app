import TimelineInteractive from "@/components/dispatch/TimelineInteractive";
import { scheduleRequest } from "@/lib/dispatch/scheduleRequest";

...

const [selectedTech, setSelectedTech] = useState<string | null>(null);
const [timeRange, setTimeRange] = useState<{ start: string; end: string } | null>(null);
const [saving, setSaving] = useState(false);

async function handleSave() {
  if (!selectedTech || !timeRange) {
    alert("Pick a technician and a time window");
    return;
  }

  setSaving(true);

  try {
    await scheduleRequest({
      requestId,
      technicianId: selectedTech,
      start: timeRange.start,
      end: timeRange.end,
    });

    onClose?.(); // close modal
  } catch (e) {
    console.error(e);
    alert("Failed to schedule");
  } finally {
    setSaving(false);
  }
}

return (
  <div className="p-4 space-y-6">

    {/* Technician list */}
    <div className="space-y-2">
      {techs.map((t) => (
        <button
          key={t.id}
          onClick={() => setSelectedTech(t.id)}
          className={`w-full text-left p-3 rounded-lg border ${
            selectedTech === t.id
              ? "border-[#80FF44] bg-[#80FF44]/10"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>

    {/* TIMELINE */}
    <TimelineInteractive onChange={(range) => setTimeRange(range)} />

    {/* FOOTER BUTTON */}
    <button
      onClick={handleSave}
      disabled={!selectedTech || !timeRange || saving}
      className="
        w-full py-3 rounded-lg
        bg-[#80FF44] text-black font-semibold
        disabled:opacity-40 disabled:cursor-not-allowed
      "
    >
      {saving ? "Saving…" : "Schedule Request"}
    </button>
  </div>
);
