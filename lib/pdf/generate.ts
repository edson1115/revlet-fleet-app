// lib/pdf/generate.ts
import React from "react";
import { ServiceRequestPdf } from "./templates/serviceRequestPdf";
import { pdf } from "@react-pdf/renderer";

/**
 * Given the Step 3 payload, renders a PDF buffer using the Step 4 JSX template.
 */
export async function generateServiceRequestPdf(reportData: any) {
  // Create the element
  const doc = React.createElement(ServiceRequestPdf, { data: reportData });
  
  // FIX: Cast doc to 'any' to bypass the strict DocumentProps type check
  // as ServiceRequestPdf returns the required <Document> structure internally.
  const buffer = await pdf(doc as any).toBuffer();
  
  return buffer;
}