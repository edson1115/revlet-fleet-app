export const ACTIVE_MARKET = "SAN_ANTONIO";

export function enforceMarket(row: { market?: string | null }) {
  if (!row.market) return false;
  return row.market === ACTIVE_MARKET;
}
