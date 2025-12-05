"use client";

import { useEffect, useState } from "react";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { CalendarPlus, RefreshCcw, Trash2 } from "lucide-react";

type Recurring = {
  id: string;
  frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  weekday?: number | null;
  day_of_month?: number | null;
  next_run: string | null;
  active: boolean;
};

export default function RecurringPanel({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recurring[]>([]);

  const [openNew, setOpenNew] = useState(false);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/portal/customers/${customerId}/recurring`, {
      cache: "no-store",
    }).then((r) => r.json());

    setItems(r.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [customerId]);

  async function saveRecurring() {
    await fetch(`/api/portal/customers/${customerId}/recurring`, {
      method: "POST",
      body: JSON.stringify({
        frequency,
        weekday,
        day_of_month: dayOfMonth,
      }),
    });

    setOpenNew(false);
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/portal/customers/${customerId}/recurring/toggle`, {
      method: "POST",
      body: JSON.stringify({ id, active }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/portal/customers/${customerId}/recurring/delete`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recurring Inspections</h2>

        <div className="flex gap-3">
          <button
            onClick={() => setOpenNew(true)}
            className="flex items-center gap-2 py-2 px-3 bg-black text-white rounded-lg text-sm hover:bg-gray-900"
          >
            <CalendarPlus size={16} />
            Add
          </button>

          <button
            onClick={load}
            className="flex items-center gap-2 py-2 px-3 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <TeslaDivider />

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500 text-sm">No recurring rules yet.</p>
      )}

      <div className="space-y-4">
        {items.map((rec) => (
          <div
            key={rec.id}
            className="p-4 bg-white border rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {rec.frequency}
                {rec.frequency === "WEEKLY" ? ` — Day ${rec.weekday}` : ""}
                {rec.frequency === "MONTHLY" ? ` — Day ${rec.day_of_month}` : ""}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Next:{" "}
                {rec.next_run
                  ? new Date(rec.next_run).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toggleActive(rec.id, rec.active)}
                className={`px-3 py-1 rounded text-sm text-white ${
                  rec.active ? "bg-red-500" : "bg-green-600"
                }`}
              >
                {rec.active ? "Disable" : "Enable"}
              </button>

              <button
                onClick={() => remove(rec.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEW MODAL */}
      {openNew && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] space-y-5">
            <h3 className="text-lg font-semibold">New Recurring Rule</h3>

            <TeslaSection label="Frequency">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="bg-[#F5F5F5] px-3 py-2 rounded-lg text-sm w-full"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </TeslaSection>

            {frequency === "WEEKLY" && (
              <TeslaSection label="Day of Week">
                <select
                  value={weekday}
                  onChange={(e) => setWeekday(Number(e.target.value))}
                  className="bg-[#F5F5F5] px-3 py-2 rounded-lg text-sm w-full"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </TeslaSection>
            )}

            {frequency === "MONTHLY" && (
              <TeslaSection label="Day of Month">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="bg-[#F5F5F5] px-3 py-2 rounded-lg text-sm w-full"
                />
              </TeslaSection>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenNew(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>

              <button
                onClick={saveRecurring}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
