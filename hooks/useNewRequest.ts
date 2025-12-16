"use client";

import { useEffect, useState } from "react";

export interface NewRequestData {
  vehicle_id: string | null;
  service_type: string | null;
  description: string;
  photos: string[];
  ai_summary: string | null;
  ai_parts: any[] | null;
  ai_next_service: string | null;
}

const KEY = "revlet.newRequest";

export function useNewRequest() {
  const [data, setData] = useState<NewRequestData>({
    vehicle_id: null,
    service_type: null,
    description: "",
    photos: [],
    ai_summary: null,
    ai_parts: null,
    ai_next_service: null,
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  // Save whenever data changes
  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  return {
    data,

    setVehicle(id: string) {
      setData((prev) => ({ ...prev, vehicle_id: id }));
    },

    setServiceType(v: string) {
      setData((prev) => ({ ...prev, service_type: v }));
    },

    setDescription(v: string) {
      setData((prev) => ({ ...prev, description: v }));
    },

    addPhoto(url: string) {
      setData((prev) => ({ ...prev, photos: [...prev.photos, url] }));
    },

    setAISummary(t: string) {
      setData((prev) => ({ ...prev, ai_summary: t }));
    },

    setAIParts(parts: any[]) {
      setData((prev) => ({ ...prev, ai_parts: parts }));
    },

    setAINextService(t: string) {
      setData((prev) => ({ ...prev, ai_next_service: t }));
    },

    reset() {
      sessionStorage.removeItem(KEY);
      setData({
        vehicle_id: null,
        service_type: null,
        description: "",
        photos: [],
        ai_summary: null,
        ai_parts: null,
        ai_next_service: null,
      });
    },
  };
}
