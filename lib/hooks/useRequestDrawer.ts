// lib/hooks/useRequestDrawer.ts
"use client";

import { create } from "zustand";

type DrawerState = {
  id: string | null;
  isOpen: boolean;
  open: (id: string) => void;
  close: () => void;
};

export const useRequestDrawer = create<DrawerState>((set) => ({
  id: null,
  isOpen: false,
  open: (id: string) => set({ id, isOpen: true }),
  close: () => set({ id: null, isOpen: false }),
}));
