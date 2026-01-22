"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PDFSynthesisRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hybrid");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      <p className="text-neutral-400 font-mono text-sm uppercase tracking-wider">
        Redirecting to Unified Synthesis Engine...
      </p>
    </div>
  );
}
