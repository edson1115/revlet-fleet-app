"use client";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

export default function ContactsPanel({ customerId }: { customerId: string }) {
  const [contacts, setContacts] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/customers/${customerId}/contacts`)
      .then((r) => r.json())
      .then((d) => setContacts(d.rows || []));
  }, [customerId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>

      <TeslaSection label="Primary Contacts">
        {contacts.length === 0 && (
          <div className="text-sm text-gray-500">
            No contacts added.
          </div>
        )}

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {contacts.map((c) => (
            <TeslaListRow
              key={c.id}
              title={c.name}
              subtitle={c.email}
              metaLeft={c.phone}
              rightIcon={false}
            />
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
