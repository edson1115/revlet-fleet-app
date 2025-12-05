// lib/store/requestDrawer.ts
import { create } from "zustand";

interface RequestDrawerState {
  isOpen: boolean;
  requestId: string | null;
  refreshFlag: number; // triggers re-fetch inside drawer
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  requestRefresh: () => void;
}

export const useRequestDrawer = create<RequestDrawerState>((set) => ({
  isOpen: false,
  requestId: null,
  refreshFlag: 0,

  openDrawer: (id: string) =>
    set({
      isOpen: true,
      requestId: id,
    }),

  closeDrawer: () =>
    set({
      isOpen: false,
      requestId: null,
    }),

  requestRefresh: () =>
    set((state) => ({
      refreshFlag: state.refreshFlag + 1,
    })),
}));
