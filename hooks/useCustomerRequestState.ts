"use client";

import { useState } from "react";

export function useCustomerRequestState() {
  // Step (1–5)
  const [step, setStep] = useState(1);

  // Selected Vehicle
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);

  // Service Type
  const [serviceType, setServiceType] = useState<string | null>(null);

  // Problem Description
  const [notes, setNotes] = useState("");

  // Photo Uploads
  const [photos, setPhotos] = useState<File[]>([]);

  function addPhoto(file: File) {
    setPhotos((prev) => [...prev, file]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function next() {
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  return {
    step,
    next,
    back,

    vehicleId,
    setVehicleId,
    vehicleInfo,
    setVehicleInfo,

    serviceType,
    setServiceType,

    notes,
    setNotes,

    photos,
    addPhoto,
    removePhoto,
  };
}
