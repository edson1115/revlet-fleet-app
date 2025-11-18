// app/fm/inspections/builder/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import InspectionBuilderClient from "./page.client";

export default function Page() {
  return <InspectionBuilderClient />;
}
