"use client";

import PDFButton from "@/components/PDFButton";
import PDFShareButton from "@/components/PDFShareButton";
import PDFEmailButton from "@/components/PDFEmailButton";

export default function PDFToolbar({ requestId }: { requestId: string }) {
  return (
    <div className="flex gap-2">
      <PDFButton requestId={requestId} />
      <PDFShareButton requestId={requestId} />
      <PDFEmailButton requestId={requestId} />
    </div>
  );
}



