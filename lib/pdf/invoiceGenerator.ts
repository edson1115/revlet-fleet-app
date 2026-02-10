// Placeholder for legacy invoice generator
export async function generateInvoicePDF(request: any): Promise<Uint8Array> {
  console.log("Generating PDF for request:", request.id);
  // Return an empty PDF buffer for now to satisfy the build
  return new Uint8Array(); 
}