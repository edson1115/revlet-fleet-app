"use client";

import { useFormStatus } from "react-dom";

export default function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="px-2 py-1 rounded border text-xs disabled:opacity-50"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
