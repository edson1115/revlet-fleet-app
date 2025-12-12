"use client";

export function useAIParts() {
  async function run(imageUrl: string) {
    return { parts: [] };
  }

  return { run };
}
