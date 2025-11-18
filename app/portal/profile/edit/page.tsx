"use client";

import { useState, useEffect } from "react";

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryContact, setSecondaryContact] = useState("");

  async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function patchJSON<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await fetchJSON<{
          first_name?: string;
          last_name?: string;
          phone?: string;
          secondary_contact?: string;
        }>("/api/portal/profile");

        if (!live) return;

        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setPhone(data.phone ?? "");
        setSecondaryContact(data.secondary_contact ?? "");
      } catch (e: any) {
        setErr(e?.message || "Failed to load profile");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  async function saveProfile() {
    setErr("");
    try {
      await patchJSON("/api/portal/profile", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        secondary_contact: secondaryContact.trim(),
      });
      alert("Saved!");
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Edit Profile</h1>

      {err ? (
        <div className="border border-red-300 bg-red-50 p-2 rounded text-red-700">
          {err}
        </div>
      ) : null}

      {/* FORM FIELDS */}
      {(
        [
          ["First Name", firstName, setFirstName],
          ["Last Name", lastName, setLastName],
          ["Phone", phone, setPhone],
          ["Secondary Contact", secondaryContact, setSecondaryContact],
        ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]
      ).map(([label, val, setter]) => (
        <label key={label} className="block text-sm space-y-1">
          <span className="text-gray-600">{label}</span>
          <input
            className="border rounded-md px-3 py-2 w-full"
            value={val}
            onChange={(e) => setter(e.target.value)}
          />
        </label>
      ))}

      <div>
        <button
          onClick={saveProfile}
          className="px-4 py-2 bg-black text-white rounded hover:opacity-80"
        >
          Save
        </button>
      </div>
    </div>
  );
}
