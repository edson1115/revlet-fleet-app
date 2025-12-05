"use client";

import { useEffect, useState } from "react";

export function RoleStatusBar() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const js = await res.json();
      if (js.ok) setProfile(js.profile);
    }
    load();
  }, []);

  if (!profile) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-md text-sm opacity-80 hover:opacity-100">
      <div className="font-semibold">
        {profile.full_name || profile.email}
      </div>
      <div className="text-gray-300 text-xs">{profile.role}</div>
      {profile.active_market && (
        <div className="text-gray-400 text-xs">
          Market: {profile.active_market}
        </div>
      )}
    </div>
  );
}
