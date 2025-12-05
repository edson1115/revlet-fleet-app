"use client";

import { useState } from "react";

export function InviteUserButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CUSTOMER");

  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendInvite() {
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          role,
          company_id: companyId || undefined,
          customer_id: customerId || undefined,
          // backend accepts array; keep single location_id for convenience
          location_id: locationId || undefined,
          account_name: accountName || undefined,
          account_number: accountNumber || undefined,
          contact_name: contactName || undefined,
          contact_phone: contactPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invite failed.");
      setOkMsg(`Invite sent to ${data.invited}`);
      // keep role, clear the rest
      setEmail("");
      setCustomerId("");
      setLocationId("");
      setAccountName("");
      setAccountNumber("");
      setContactName("");
      setContactPhone("");
    } catch (e: any) {
      setError(e?.message || "Invite failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md bg-black text-white"
      >
        Invite User
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invite User</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-sm px-2 py-1 rounded-md border"
              >
                ✕
              </button>
            </div>

            {error ? (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </div>
            ) : null}

            {okMsg ? (
              <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-md p-2">
                {okMsg}
              </div>
            ) : null}

            {/* Email + Role */}
            <label className="block text-sm space-y-1">
              <span>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="customer@example.com"
              />
            </label>

            <label className="block text-sm space-y-1">
              <span>Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="OFFICE">OFFICE</option>
                <option value="DISPATCH">DISPATCH</option>
                <option value="TECH">TECH</option>
                <option value="ADMIN">ADMIN</option>
                {/* SUPERADMIN is intentionally omitted here */}
              </select>
            </label>

            {/* Account info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm space-y-1 md:col-span-2">
                <span>Name of the Account</span>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Peak Logistics – Station 12"
                />
              </label>

              <label className="block text-sm space-y-1">
                <span>Account Number (optional)</span>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g. 12345"
                />
              </label>

              <label className="block text-sm space-y-1">
                <span>Location ID (optional)</span>
                <input
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 font-mono text-xs"
                  placeholder="uuid-of-location"
                />
              </label>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm space-y-1">
                <span>Contact Name</span>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="John Doe"
                />
              </label>

              <label className="block text-sm space-y-1">
                <span>Contact Phone</span>
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="+1 (210) 555-1234"
                />
              </label>
            </div>

            {/* Customer + Company IDs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm space-y-1">
                <span>Customer ID</span>
                <input
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 font-mono text-xs"
                  placeholder="uuid-of-customer"
                />
              </label>

              <label className="block text-sm space-y-1">
                <span>Company ID (optional / superadmin)</span>
                <input
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 font-mono text-xs"
                  placeholder="leave blank to inherit"
                />
              </label>
            </div>

            <button
              onClick={sendInvite}
              disabled={busy || !email}
              className="w-full py-2 rounded-md bg-black text-white disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}



