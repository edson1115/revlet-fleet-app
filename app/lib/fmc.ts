// lib/fmc.ts
export const FMC_OPTIONS = [
  "LMR",
  "Element",
  "Enterprise Fleet",
  "Merchant",
  "Holman",
  "EAN",
  "Hertz",
  "Fleetio",
  "Other",
] as const;

export type FmcLabel = (typeof FMC_OPTIONS)[number];

export function isValidFmc(value: unknown): value is FmcLabel {
  return typeof value === "string" && (FMC_OPTIONS as readonly string[]).includes(value);
}
