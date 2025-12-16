"use client";

import React from "react";
import RequestDetailClient from "./RequestDetailClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function CustomerRequestDetailPage(props: Props) {
  // ✅ Next.js 15 compliant param unwrapping
  const { id } = React.use(props.params);

  // Shortened clean ID (first 8 chars, uppercase)
  const shortId = id?.split("-")[0]?.toUpperCase() ?? "";

  return (
    <RequestDetailClient
      params={{
        id,
        shortId,
      }}
    />
  );
}
