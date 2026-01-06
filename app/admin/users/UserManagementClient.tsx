"use client";

import { useState } from "react";
import { inviteUser, deleteUser } from "@/app/actions/admin";

const ROLES = [
  { value: "SUPER_ADMIN", label: "👑 Super Admin", color: "bg-purple-100 text-purple-800" },
  { value: "ADMIN", label: "🧠 Admin", color: "bg-blue-100 text-blue-800" },
  { value: "OFFICE", label: "💻 Office", color: "bg-indigo-100 text-indigo-800" },
  { value: "DISPATCHER", label: "🚚 Dispatcher", color: "bg-orange-100 text-orange-800" },
  { value: "SALES_REP", label: "🤝 Sales Rep", color: "bg-green-100 text-green-800" },
  { value: "TECHNICIAN", label: "🔧 Technician", color: "bg-gray-100 text-gray-800" },
  { value: "CUSTOMER", label: "👤 Customer", color: "bg-gray-50 text-gray-500" },
];

export default function UserManagementClient({ users }: { users: any[] }) {
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleInvite(formData: FormData) {
    setIsInviting(true);
    setMessage("");
    
    const res = await inviteUser(formData);
    
    setIsInviting(false);
    if (res.error) {
        setMessage(`❌ ${res.error}`);
    } else {
        setMessage("✅ Invitation sent successfully!");
        window.location.reload(); // Refresh to see the new user
    }
  }

  async function handleDelete(userId: string) {
      if(!confirm("Are you sure? This effectively bans the user.")) return;
      await deleteUser(userId);
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-black text-gray-900">User Management</h1>
            <p className="text-gray-500">Manage employee access and roles.</p>
        </div>
      </div>

      {/* --- INVITE FORM --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-lg font-bold mb-4">Invite New User</h2>
        <form action={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <input name="fullName" required placeholder="e.g. John Doe" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input name="email" type="email" required placeholder="john@company.com" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200" />
          </div>
          <div className="w-full md:w-64">
            <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
            <select name="role" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button disabled={isInviting} className="w-full md:w-auto px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {isInviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {message && <div className="mt-4 font-bold text-sm animate-pulse">{message}</div>}
      </div>

      {/* --- USER LIST --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase">User</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase">Role</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
                const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[6];
                return (
                    <tr key={user.id} className="hover:bg-gray-50">
                        <td className="p-4">
                            <div className="font-bold text-gray-900">{user.full_name || "Unknown"}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleConfig.color}`}>
                                {roleConfig.label}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                            <button onClick={() => handleDelete(user.id)} className="text-red-500 font-bold text-xs hover:underline">Remove</button>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}