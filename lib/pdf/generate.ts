// lib/pdf/generate.ts
import { ServiceRequestPdf } from "./templates/serviceRequestPdf";
import { pdf } from "@react-pdf/renderer";

/**
 * Given the Step 3 payload, renders a PDF buffer using the Step 4 JSX template.
 */
export async function generateServiceRequestPdf(data: any) {
  const doc = <ServiceRequestPdf data={data} />;
  const buffer = await pdf(doc).toBuffer();
  return buffer;
}
