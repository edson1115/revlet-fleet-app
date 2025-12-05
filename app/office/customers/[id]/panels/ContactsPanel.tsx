"use client";

import { useEffect, useState } from "react";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { Plus, Trash2, RefreshCcw } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
};

export default function ContactsPanel({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(
      `/api/portal/customers/${customerId}/contacts`,
      { cache: "no-store" }
    ).then((r) => r.json());
    setContacts(res.contacts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [customerId]);

  async function add() {
    await fetch(`/api/portal/customers/${customerId}/contacts/create`, {
      method: "POST",
      body: JSON.stringify({ name, role, email, phone }),
    });
    setOpenNew(false);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/portal/customers/${customerId}/contacts/delete`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Contacts</h2>

        <div className="flex gap-3">
          <button
            onClick={() => setOpenNew(true)}
            className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-900"
          >
            <Plus size={16} />
            Add
          </button>

          <button
            onClick={load}
            className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <TeslaDivider />

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!loading && contacts.length === 0 && (
        <p className="text-gray-500 text-sm">No contacts added.</p>
      )}

      <div className="space-y-4">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="p-4 bg-white border rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-sm">{c.name}</p>
              <p className="text-xs text-gray-500">
                {c.role || "No role"} • {c.email || "No email"} •{" "}
                {c.phone || "No phone"}
              </p>
            </div>

            <button
              onClick={() => remove(c.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* NEW CONTACT MODAL */}
      {openNew && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
            <h3 className="text-lg font-semibold">New Contact</h3>

            <TeslaSection label="Name">
              <input
                className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </TeslaSection>

            <TeslaSection label="Role">
              <input
                className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </TeslaSection>

            <TeslaSection label="Email">
              <input
                className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </TeslaSection>

            <TeslaSection label="Phone">
              <input
                className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </TeslaSection>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenNew(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>

              <button
                onClick={add}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
