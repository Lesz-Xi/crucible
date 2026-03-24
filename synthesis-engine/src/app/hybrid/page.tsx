"use client";

import { useEffect, useState } from "react";
import HybridLegacyPage from "@/components/hybrid/HybridLegacyPage";
import { HybridWorkbenchV2 } from "@/components/hybrid/HybridWorkbenchV2";

export default function HybridPage() {
  const [useV2, setUseV2] = useState(true);

  useEffect(() => {
    setUseV2(true);
  }, []);

  if (useV2) {
    return <HybridWorkbenchV2 />;
  }

  return <HybridLegacyPage />;
}
