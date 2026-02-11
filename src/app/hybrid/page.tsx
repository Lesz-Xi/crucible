"use client";

import { useEffect, useState } from "react";
import HybridLegacyPage from "@/components/hybrid/HybridLegacyPage";
import { HybridWorkbenchV2 } from "@/components/hybrid/HybridWorkbenchV2";
import { resolveUiFlags } from "@/lib/config/ui-flags";

export default function HybridPage() {
  const [useV2, setUseV2] = useState(false);

  useEffect(() => {
    setUseV2(resolveUiFlags().autoSciLayoutV2);
  }, []);

  if (useV2) {
    return <HybridWorkbenchV2 />;
  }

  return <HybridLegacyPage />;
}
