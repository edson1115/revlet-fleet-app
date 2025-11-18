// app/customer/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
  address?: string | null;
  approval_type: "MANAGED" | "DIRECT";
};

export default function CustomerPage({ params }: any) {
  const customerId = params.id;
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Recurring modal state
  const [openRecurring, setOpenRecurring] = useState(false);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  // Load customer + joined data
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/portal/customer/${customerId}`);
      const data = await res.json();

      setCustomer(data.customer);
      setRequests(data.requests || []);
      setVehicles(data.vehicles || []);
    }
    load();
  }, [customerId]);

  async function saveRecurring() {
    await fetch(`/api/customers/${customerId}/recurring`, {
      method: "POST",
      body: JSON.stringify({
        frequency,
        weekday,
        day_of_month: dayOfMonth,
      }),
    });

    alert("Recurring inspection scheduled!");
    setOpenRecurring(false);
  }

  if (!customer) {
    return <div className="p-6">Loading customer…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-gray-600">
            {customer.address || "No address on file"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Approval Type:{" "}
            <span className="font-semibold text-indigo-600">
              {customer.approval_type}
            </span>
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              router.push(`/fm/requests/new?customer=${customer.id}`)
            }
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            New Service Request
          </button>

          <button
            onClick={() => setOpenRecurring(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Set Recurring Inspection
          </button>
        </div>
      </div>

      {/* FLEET HEALTH */}
      <FleetHealth customerId={customer.id} />

      {/* VEHICLES SECTION */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Vehicles ({vehicles.length})
        </h2>
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="p-4 border rounded shadow-sm">
              <p className="font-semibold">
                {v.year} {v.make} {v.model}
              </p>
              <p className="text-gray-600 text-sm">Unit: {v.unit_number}</p>
              <p className="text-gray-600 text-sm">Plate: {v.plate}</p>
            </div>
          ))}
        </div>
      </div>

      {/* REQUEST HISTORY */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Requests</h2>

        {requests.length === 0 && (
          <p className="text-gray-500">No service requests yet.</p>
        )}

        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-4 border rounded shadow-sm">
              <p className="font-semibold">
                {r.service_type || "Service"} — #{r.id.slice(0, 6)}
              </p>
              <p className="text-gray-600 text-sm">{r.description}</p>
              <p className="text-xs mt-1 text-gray-500">Status: {r.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RECURRING INSPECTIONS LIST */}
      <RecurringInspections customerId={customer.id} />

      {/* RECURRING INSPECTION MODAL */}
      {openRecurring && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white p-6 w-96 rounded shadow-xl">
            <h2 className="text-xl font-semibold mb-4">
              Recurring Inspection
            </h2>

            {/* FREQUENCY SELECT */}
            <label className="block mb-4">
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
              <label className="block mb-4">
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
              <label className="block mb-4">
                <span className="text-gray-700">Day of Month</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) =>
                    setDayOfMonth(Number(e.target.value))
                  }
                  className="mt-1 block w-full border rounded p-2"
                />
              </label>
            )}

            {/* FOOTER */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setOpenRecurring(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveRecurring}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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

/* ----------------------------
   RECURRING INSPECTIONS LIST
----------------------------- */
function RecurringInspections({ customerId }: { customerId: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/customers/${customerId}/recurring/list`)
      .then((r) => r.json())
      .then((res) => setItems(res.data || []));
  }, [customerId]);

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/customers/${customerId}/recurring/toggle`, {
      method: "POST",
      body: JSON.stringify({ id, active }),
    });

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, active: !active } : i))
    );
  }

  if (!items.length) {
    return (
      <p className="text-gray-500">No recurring inspections set.</p>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        Recurring Inspections
      </h2>
      <div className="space-y-3">
        {items.map((rec) => (
          <div
            key={rec.id}
            className="p-4 border rounded shadow flex justify-between"
          >
            <div>
              <p className="font-semibold">
                {rec.frequency} — Next:{" "}
                {new Date(rec.next_run).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => toggleActive(rec.id, rec.active)}
              className={`px-3 py-1 rounded ${
                rec.active
                  ? "bg-red-500 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              {rec.active ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------
       FLEET HEALTH BLOCK
----------------------------- */
function FleetHealth({ customerId }: { customerId: string }) {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/customers/${customerId}/health`)
      .then((r) => r.json())
      .then((res) => setMetrics(res));
  }, [customerId]);

  if (!metrics) return null;

  return (
    <div className="p-4 border rounded shadow bg-gray-50 mt-4">
      <h3 className="text-lg font-semibold mb-2">Fleet Health</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Vehicles</p>
          <p className="font-bold">{metrics.totalVehicles}</p>
        </div>

        <div>
          <p className="text-gray-600">Open Requests</p>
          <p className="font-bold">{metrics.openRequests}</p>
        </div>

        <div>
          <p className="text-gray-600">Days Since Last Inspection</p>
          <p className="font-bold">
            {metrics.daysSinceLastInspection}
          </p>
        </div>

        <div>
          <p className="text-gray-600">Health Grade</p>
          <p className="font-bold text-indigo-600 text-xl">
            {metrics.grade}
          </p>
        </div>
      </div>
    </div>
  );
}
