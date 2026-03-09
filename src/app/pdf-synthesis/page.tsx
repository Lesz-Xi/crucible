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
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <Loader2
        style={{ width: 28, height: 28, color: "var(--accent)" }}
        className="animate-spin"
      />
      <p
        className="label-mono"
        style={{ color: "var(--text-3)" }}
      >
        Loading Protocol Ingestion Engine...
      </p>
    </div>
  );
}
