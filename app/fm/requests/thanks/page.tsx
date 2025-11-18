// app/fm/requests/thanks/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import ThanksClient from "./page.client";

export default function Page() {
  return <ThanksClient />;
}
