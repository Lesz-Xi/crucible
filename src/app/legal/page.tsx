"use client";

import { useEffect, useState } from "react";
import LegalLegacyPage from "@/components/legal/LegalLegacyPage";
import { LegalWorkbenchV2 } from "@/components/legal/LegalWorkbenchV2";

export default function LegalPage() {
  const [useV2, setUseV2] = useState(true);

  useEffect(() => {
    setUseV2(true);

    document.body.classList.add('liquid-glass-v2', 'lab-glass-system');
    return () => {
      document.body.classList.remove('liquid-glass-v2', 'lab-glass-system');
    };
  }, []);

  if (useV2) {
    return <LegalWorkbenchV2 />;
  }

  return <LegalLegacyPage />;
}
