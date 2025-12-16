"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";

export default function TeslaVehicleHealthUploader({
  value,
  onChange,
}: {
  value: string[];          // array of public URLs
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  // helper: upload file to your API
  async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/uploads/vehicle-health", {
      method: "POST",
      body,
    });

    const js = await res.json();
    if (!js.ok) throw new Error(js.error || "Upload failed");

    return js.url;
  }

  // handle click → select file → upload
  async function handlePickFile() {
    if (value.length >= 3) {
      alert("Maximum of 3 photos allowed.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        const url = await uploadFile(file);

        const next = [...value, url].slice(0, 3); // safety
        onChange(next);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setUploading(false);
      }
    };
  }

  // remove a health photo
  function removeAt(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <label className="font-medium text-gray-800">Vehicle Health Photos</label>

      <div className="grid grid-cols-3 gap-3">
        {/* Existing photos */}
        <AnimatePresence>
          {value.map((src, idx) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <img
                src={src}
                className="w-full h-24 rounded-xl object-cover border cursor-pointer hover:opacity-80 transition"
              />

              {/* Remove button */}
              <button
                onClick={() => removeAt(idx)}
                className="absolute -top-2 -right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Upload button */}
        {value.length < 3 && (
          <button
            onClick={handlePickFile}
            disabled={uploading}
            className="h-24 rounded-xl border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition relative"
          >
            {uploading ? (
              <div className="animate-pulse text-gray-600 text-sm">
                Uploading…
              </div>
            ) : (
              <Camera className="text-gray-700" size={28} />
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Upload up to <strong>3 photos</strong> (front, sides, rear).
      </p>
    </div>
  );
}
