"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

type Contact = {
  id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export default function ContactsPanel({
  customerId,
}: {
  customerId: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // load contacts
  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/customers/${customerId}/contacts`);
      const js = await r.json();
      setContacts(js.data || []);
    }
    load();
  }, [customerId]);

  function openNew() {
    setEditing(null);
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
    setNotes("");
    setOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setName(c.name);
    setRole(c.role || "");
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setNotes(c.notes || "");
    setOpen(true);
  }

  async function save() {
    const payload = {
      id: editing?.id || null,
      customer_id: customerId,
      name,
      role,
      phone,
      email,
      notes,
    };

    await fetch(`/api/customers/${customerId}/contacts/upsert`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const r = await fetch(`/api/customers/${customerId}/contacts`);
    const js = await r.json();
    setContacts(js.data || []);

    setOpen(false);
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;

    await fetch(`/api/customers/${customerId}/contacts/delete`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold tracking-tight">
        Contacts
      </h2>

      <button
        onClick={openNew}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
      >
        + Add Contact
      </button>

      {/* CONTACT LIST */}
      <div className="rounded-xl border bg-white overflow-hidden mt-6">
        {contacts.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No contacts added.
          </div>
        )}

        {contacts.map((c) => (
          <TeslaListRow
            key={c.id}
            title={c.name}
            subtitle={c.role || ""}
            metaLeft={c.phone || c.email || ""}
            rightIcon={true}
            onClick={() => openEdit(c)}
          />
        ))}
      </div>

      {/* --------------------------------------------------
           MODAL (CREATE / EDIT)
      -------------------------------------------------- */}
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editing ? "Edit Contact" : "New Contact"}
            </h3>

            <div className="space-y-6">

              <TeslaSection label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                  placeholder="Full Name"
                />
              </TeslaSection>

              <TeslaSection label="Role / Title">
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                  placeholder="Fleet Manager, Dispatcher, etc."
                />
              </TeslaSection>

              <TeslaSection label="Phone">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                  placeholder="(555) 123-4567"
                />
              </TeslaSection>

              <TeslaSection label="Email">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2"
                  placeholder="contact@example.com"
                />
              </TeslaSection>

              <TeslaSection label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#F5F5F5] rounded-lg px-3 py-2 min-h-[100px]"
                  placeholder="Internal notes about this contact"
                />
              </TeslaSection>

              <TeslaDivider />

              <div className="flex justify-between">
                {editing && (
                  <button
                    onClick={() => deleteContact(editing.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Delete
                  </button>
                )}

                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={save}
                    className="px-4 py-2 bg-black text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
