// lib/pdf/generate.ts
import React from "react"; // Ensure React is available for JSX
import { ServiceRequestPdf } from "./templates/serviceRequestPdf";
import { pdf } from "@react-pdf/renderer";

/**
 * Given the Step 3 payload, renders a PDF buffer using the Step 4 JSX template.
 * Renamed parameter to 'reportData' to avoid identifier conflicts.
 */
export async function generateServiceRequestPdf(reportData: any) {
  const doc = React.createElement(ServiceRequestPdf, { data: reportData });
  const buffer = await pdf(doc).toBuffer();
  return buffer;
}