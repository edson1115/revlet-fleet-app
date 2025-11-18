// app/login/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import LoginClient from "./page.client";

export default function Page() {
  return <LoginClient />;
}
