// lib/authz.ts
import { cookies } from "next/headers";

export type Role = "ADMIN" | "OFFICE" | "DISPATCH" | "TECH" | "CUSTOMER";

export async function getAppIdentity() {
  const ck = await cookies(); // ← async
  const role = ck.get("appRole")?.value as Role | undefined;
  const companyId = ck.get("appCompanyId")?.value;
  const linked = ck.get("appLinked")?.value === "1";

  if (!linked || !role || !companyId) {
    const err: any = new Error("Not linked / unauthorized");
    err.status = 401;
    throw err;
  }
  return { role, companyId };
}

export async function requireRole(allowed: Role[]) {
  const id = await getAppIdentity(); // ← await
  if (!allowed.includes(id.role)) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return id;
}
