"use client";

import { useState } from "react";
import { TeslaDrawer } from "@/components/tesla/TeslaDrawer";

export function TeslaLeadUpdateDrawer({ open, onClose, onSave }: any) {
  const [val, setVal] = useState("");

  async function submit() {
    await onSave(val);
    setVal("");
  }

  return (
    <TeslaDrawer open={open} onClose={onClose} title="Add Update">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full bg-gray-100 rounded-lg p-3 text-sm"
        rows={4}
      />

      <button
        onClick={submit}
        className="mt-4 w-full py-2 bg-black text-white rounded-lg text-sm"
      >
        Save Update
      </button>
    </TeslaDrawer>
  );
}
