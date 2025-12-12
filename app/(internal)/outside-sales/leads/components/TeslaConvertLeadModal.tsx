"use client";

import { TeslaModal } from "@/components/tesla/TeslaModal";

export function TeslaConvertLeadModal({ open, onClose, onConvert }: any) {
  return (
    <TeslaModal open={open} onClose={onClose} title="Convert Lead to Customer">
      <p className="text-sm text-gray-700 mb-4">
        Converting this lead will:
      </p>

      <ul className="list-disc ml-4 text-sm text-gray-600 space-y-1">
        <li>Create a customer record</li>
        <li>Create a login for the customer</li>
        <li>Send a magic link to their email</li>
      </ul>

      <button
        onClick={onConvert}
        className="w-full mt-6 py-2 bg-black text-white rounded-lg"
      >
        Convert Lead
      </button>
    </TeslaModal>
  );
}
