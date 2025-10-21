// Minimal shim so imports compile; replace with generated types later.
export type Role = "ADMIN" | "DISPATCH" | "TECH" | "OFFICE" | "FM" | "CUSTOMER";

export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: { role: Role };
  };
};
