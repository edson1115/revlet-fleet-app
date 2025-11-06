"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

export default function ToastOnMount({
  when,
  success,
  error,
}: {
  when?: string | null;
  success?: string;
  error?: string;
}) {
  useEffect(() => {
    if (!when) return;
    if (when === "signedout" && success) toast.success(success);
    if (when === "error" && error) toast.error(error);
  }, [when, success, error]);

  return null;
}
