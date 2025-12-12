"use client";

export function useAINextService() {
  async function run(vehicleData: any) {
    return { nextService: "AI prediction placeholder" };
  }

  return { run };
}
