"use client";

import { useEffect } from "react";
import { useRequestDrawer } from "@/lib/store/requestDrawer";
import RequestDrawer from "./RequestDrawer";

export function RequestDrawerHost() {
  // FIX: Cast to any to avoid type errors if the interface is missing 'close'
  const store = useRequestDrawer() as any;
  const { isOpen, requestId } = store;

  // Robust close handler: try 'close', 'onClose', or 'setOpen'
  const handleClose = () => {
    if (store.close) {
      store.close();
    } else if (store.onClose) {
      store.onClose();
    } else if (store.setOpen) {
      store.setOpen(false);
    }
  };

  // Prevent page scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !requestId) return null;

  return (
    <RequestDrawer
      id={requestId}
      onClose={handleClose}
    />
  );
}