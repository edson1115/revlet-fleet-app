"use client";

import { useEffect } from "react";
import { useToast } from "./use-toast";

export function ToasterListener() {
  const { toast } = useToast();

  useEffect(() => {
    // Example: can listen to events later
  }, []);

  return null;
}
