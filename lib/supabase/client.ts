"use client";

import { getSupabaseBrowserClient } from "./browserClient";

export function supabaseBrowser() {
  return getSupabaseBrowserClient();
}

// Keep compatibility with existing imports
export const createClient = supabaseBrowser;