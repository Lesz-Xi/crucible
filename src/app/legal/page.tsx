"use client";

import { useEffect, useState } from "react";
import LegalLegacyPage from "@/components/legal/LegalLegacyPage";
import { LegalWorkbenchV2 } from "@/components/legal/LegalWorkbenchV2";
import { resolveUiFlags } from "@/lib/config/ui-flags";

export default function LegalPage() {
  const [useV2, setUseV2] = useState(false);

  useEffect(() => {
    setUseV2(resolveUiFlags().autoSciLayoutV2);
  }, []);

  if (useV2) {
    return <LegalWorkbenchV2 />;
  }

  return <LegalLegacyPage />;
}
