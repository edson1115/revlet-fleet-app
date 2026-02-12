"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import NotificationDropdown from "./NotificationDropdown"; // Ensure this path is correct

export default function NotificationBell() {
  const supabase = supabaseBrowser();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);

  // load recent activity
  async function load() {
    try {
      const res = await fetch("/api/portal/activity?limit=20", {
        credentials: "include",
        cache: "no-store",
      });
      const js = await res.json();
      const list = js.data || [];

      setItems(list);

      // any unseen entries?
      const unseen = list.filter((i: any) => !i.seen).length;
      setUnreadCount(unseen);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }

  // mark all as seen
  async function clearUnread() {
    setUnreadCount(0);
    try {
      await fetch("/api/portal/activity/seen", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Failed to clear notifications", e);
    }
  }

  useEffect(() => {
    load();

    if (!supabase) return;

    const ch = supabase
      .channel("portal-activity")
      .on(
        "postgres_changes",
        { schema: "public", table: "activity_feed", event: "*" },
        () => load()
      )
      .subscribe();

    // FIX: Cleanup function must return void, not a Promise
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    setOpen((o) => !o);
    if (!open) clearUnread();
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <svg
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M10.5 2a6 6 0 00-6 6v3.5L3 14v1h15v-1l-1.5-2.5V8a6 6 0 00-6-6z" />
          <path d="M9.5 18a1.5 1.5 0 003 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 z-30">
          <NotificationDropdown items={items} />
        </div>
      )}
    </div>
  );
}