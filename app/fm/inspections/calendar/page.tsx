// app/fm/inspections/calendar/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function RecurringCalendarPage() {
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState<"WEEK" | "MONTH">("WEEK");

  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch("/api/fm/inspections/calendar")
      .then((r) => r.json())
      .then((res) => setItems(res.data || []));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Recurring Inspection Calendar</h1>

      {/* VIEW SWITCHER */}
      <div className="flex gap-3">
        <button
          onClick={() => setView("WEEK")}
          className={`px-4 py-2 rounded ${
            view === "WEEK" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Weekly View
        </button>

        <button
          onClick={() => setView("MONTH")}
          className={`px-4 py-2 rounded ${
            view === "MONTH" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Monthly View
        </button>
      </div>

      {/* WEEKLY VIEW */}
      {view === "WEEK" && <WeekView items={items} setSelected={setSelected} />}

      {/* MONTHLY VIEW */}
      {view === "MONTH" && (
        <MonthView items={items} setSelected={setSelected} />
      )}

      {/* EDIT MODAL */}
      {selected && (
        <EditModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ---------------------------------------------
   WEEKLY VIEW COMPONENT
---------------------------------------------- */
function WeekView({ items, setSelected }: any) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const weekly = items.filter((i: any) => i.frequency === "WEEKLY");

  return (
    <div className="grid grid-cols-7 gap-4 mt-6">
      {days.map((day, idx) => (
        <div key={day} className="p-4 border rounded h-40 overflow-auto">
          <h3 className="font-semibold mb-2">{day}</h3>

          {weekly
            .filter((w: any) => w.weekday === idx)
            .map((w: any) => (
              <div
                key={w.id}
                onClick={() => setSelected(w)}
                className="p-2 border rounded bg-blue-50 cursor-pointer mb-2"
              >
                <p className="font-semibold text-sm">{w.customers.name}</p>
                <p className="text-xs text-gray-500">{w.frequency}</p>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------
   MONTHLY VIEW COMPONENT
---------------------------------------------- */
function MonthView({ items, setSelected }: any) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthly = items.filter((i: any) => i.frequency === "MONTHLY");

  const cells = [];

  // blank leading days
  for (let i = 0; i < firstDay; i++) cells.push(null);

  // days of month
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div className="grid grid-cols-7 gap-3 mt-6">
      {cells.map((day, idx) => (
        <div
          key={idx}
          className="p-3 border rounded h-36 overflow-auto bg-white"
        >
          {day && <p className="font-semibold mb-2">{day}</p>}

          {day &&
            monthly
              .filter((m: any) => m.day_of_month === day)
              .map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="p-2 border rounded bg-green-50 cursor-pointer mb-2"
                >
                  <p className="font-semibold text-sm">
                    {m.customers.name}
                  </p>
                  <p className="text-xs text-gray-500">{m.frequency}</p>
                </div>
              ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------
   EDIT MODAL COMPONENT
---------------------------------------------- */
function EditModal({ item, onClose }: any) {
  const [frequency, setFrequency] = useState(item.frequency);
  const [weekday, setWeekday] = useState(item.weekday || 1);
  const [dom, setDom] = useState(item.day_of_month || 1);

  async function save() {
    await fetch(`/api/customers/${item.customer_id}/recurring/update`, {
      method: "POST",
      body: JSON.stringify({
        id: item.id,
        frequency,
        weekday,
        day_of_month: dom,
      }),
    });

    alert("Updated!");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
      <div className="bg-white p-6 w-96 rounded shadow-xl space-y-4">
        <h2 className="text-xl font-semibold">
          Edit Recurring Inspection
        </h2>

        {/* FREQUENCY */}
        <label className="block">
          <span className="text-gray-700">Frequency</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
        </label>

        {/* WEEKLY */}
        {frequency === "WEEKLY" && (
          <label className="block">
            <span className="text-gray-700">Day of Week</span>
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </label>
        )}

        {/* MONTHLY */}
        {frequency === "MONTHLY" && (
          <label className="block">
            <span className="text-gray-700">Day of Month</span>
            <input
              type="number"
              min="1"
              max="31"
              value={dom}
              onChange={(e) => setDom(Number(e.target.value))}
              className="mt-1 block w-full border rounded p-2"
            />
          </label>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>

          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
